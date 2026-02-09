import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import type { AgentVariables } from "../lib/auth.js";
import { requireAgent } from "../lib/auth.js";
import { dflowGet } from "../lib/dflow-client.js";
import { DFlowNetworkError } from "../lib/dflow-client.js";
import { getOrderQuote } from "../lib/dflow-trading-client.js";
import { parseBody } from "../lib/validation.js";
import { buyTradeSchema, sellTradeSchema, redeemTradeSchema } from "../lib/schemas/trading.js";
import { env } from "../config.js";
import { db } from "../db/client.js";
import { agentBalances, positions, trades, redemptions } from "../db/schema.js";
import { calculateFeeBreakdown } from "../lib/fees.js";

export const tradingRoutes = new Hono<{ Variables: AgentVariables }>();

type MarketAccountInfo = { yesMint?: string; noMint?: string; isInitialized?: boolean };
type MarketResponse = { market?: Record<string, unknown> } & Record<string, unknown>;

function pickOutcomeMints(market: Record<string, unknown>): { yesMint: string; noMint: string } | null {
  const accounts = market.accounts;
  if (!accounts || typeof accounts !== "object") return null;
  const accountValues = Object.values(accounts as Record<string, unknown>);
  for (const entry of accountValues) {
    if (!entry || typeof entry !== "object") continue;
    const info = entry as MarketAccountInfo;
    if (info.yesMint && info.noMint) return { yesMint: info.yesMint, noMint: info.noMint };
  }
  return null;
}

/** Returns true if the outcome account for this side is initialized and tradable on-chain. */
function isOutcomeAccountInitialized(
  market: Record<string, unknown>,
  side: "YES" | "NO",
  mints: { yesMint: string; noMint: string },
): boolean {
  const accounts = market.accounts;
  if (!accounts || typeof accounts !== "object") return false;
  const targetMint = side === "YES" ? mints.yesMint : mints.noMint;
  const accountValues = Object.values(accounts as Record<string, unknown>);
  for (const entry of accountValues) {
    if (!entry || typeof entry !== "object") continue;
    const info = entry as MarketAccountInfo;
    const mint = side === "YES" ? info.yesMint : info.noMint;
    if (mint === targetMint) return info.isInitialized === true;
  }
  return false;
}

function parseMarketStatus(market: Record<string, unknown>): string | null {
  const status = market.status;
  return typeof status === "string" ? status : null;
}

function getMarketTicker(market: Record<string, unknown>): string | null {
  const ticker = market.ticker;
  return typeof ticker === "string" ? ticker : null;
}

function getMarketPrice(market: Record<string, unknown>, side: "YES" | "NO"): number | null {
  const yesBid = typeof market.yesBid === "string" ? Number(market.yesBid) : Number(market.yesBid);
  const yesAsk = typeof market.yesAsk === "string" ? Number(market.yesAsk) : Number(market.yesAsk);
  const noBid = typeof market.noBid === "string" ? Number(market.noBid) : Number(market.noBid);
  const noAsk = typeof market.noAsk === "string" ? Number(market.noAsk) : Number(market.noAsk);

  const price =
    side === "YES"
      ? (Number.isFinite(yesBid) ? yesBid : null) ?? (Number.isFinite(yesAsk) ? yesAsk : null)
      : (Number.isFinite(noBid) ? noBid : null) ?? (Number.isFinite(noAsk) ? noAsk : null);

  return price ?? null;
}

async function fetchMarket(ticker: string): Promise<{ status: number; market?: Record<string, unknown> }> {
  const res = await dflowGet(`/api/v1/market/${encodeURIComponent(ticker)}`);
  const body = (await res.json()) as MarketResponse;
  const market = (body.market as Record<string, unknown>) ?? (body as Record<string, unknown>);
  return { status: res.status, market };
}

function scaledToNumber(value: string, decimals: number): number {
  const raw = Number(value);
  return raw / Math.pow(10, decimals);
}

function formatNumeric(value: number, scale = 6): string {
  return value.toFixed(scale);
}

function resolveDecimals(routePlan?: Array<Record<string, unknown>>): {
  inputDecimals: number;
  outputDecimals: number;
} {
  if (!routePlan || routePlan.length === 0) {
    return { inputDecimals: 6, outputDecimals: 6 };
  }
  const first = routePlan[0] as Record<string, unknown>;
  const last = routePlan[routePlan.length - 1] as Record<string, unknown>;
  const inputDecimals = Number(first.inputMintDecimals ?? 6);
  const outputDecimals = Number(last.outputMintDecimals ?? 6);
  return { inputDecimals, outputDecimals };
}

/** Map DFlow order API error to a clearer user-facing message. */
function dflowOrderErrorBody(body: Record<string, unknown>): Record<string, unknown> {
  const code = body.code;
  const msg = typeof body.msg === "string" ? body.msg : "";
  if (code === "route_not_found") {
    return {
      error:
        "No liquidity route for this trade. The market may not support this direction on the current API (try production quote API or another market).",
      code,
      dflowMsg: msg,
    };
  }
  return { error: msg || "Quote request failed", code, ...body };
}

tradingRoutes.post("/buy", requireAgent, async (c) => {
  const parsed = await parseBody(c, buyTradeSchema);
  if (parsed instanceof Response) return parsed;

  if (!Number.isFinite(parsed.amount) || parsed.amount <= 0) {
    return c.json({ error: "amount must be greater than 0" }, 400);
  }

  const agent = c.get("agent");
  const marketResult = await fetchMarket(parsed.marketTicker);
  if (marketResult.status !== 200 || !marketResult.market) {
    return c.json({ error: "Market not found" }, marketResult.status as 400 | 404);
  }

  const market = marketResult.market;
  const status = parseMarketStatus(market);
  if (status !== "active") {
    return c.json({ error: "Market is not active" }, 400);
  }

  const mints = pickOutcomeMints(market);
  if (!mints) {
    return c.json({ error: "Market outcome mints not found" }, 400);
  }
  if (!isOutcomeAccountInitialized(market, parsed.side, mints)) {
    return c.json({ error: "Market is not tradable (outcome account not initialized)" }, 400);
  }

  const outputMint = parsed.side === "YES" ? mints.yesMint : mints.noMint;
  const amountScaled = Math.round(parsed.amount * 1_000_000);

  try {
    const quote = await getOrderQuote(env.USDC_MINT, outputMint, amountScaled);
    if (quote.status >= 400) {
      const errBody = dflowOrderErrorBody(quote.body as Record<string, unknown>);
      return c.json(errBody, quote.status as 400 | 500 | 503);
    }

    const { inputDecimals, outputDecimals } = resolveDecimals(quote.body.routePlan as Array<Record<string, unknown>>);
    const inAmount = scaledToNumber(quote.body.inAmount, inputDecimals);
    const outContracts = scaledToNumber(quote.body.outAmount, outputDecimals);
    if (outContracts <= 0) {
      return c.json({ error: "Invalid quote output amount" }, 400);
    }

    const feeBreakdown = calculateFeeBreakdown(outContracts, inAmount / outContracts);
    const netContracts = outContracts - feeBreakdown.totalFee;
    if (netContracts <= 0) {
      return c.json({ error: "Trade results in zero net contracts" }, 400);
    }

    const pricePerContract = inAmount / netContracts;

    const result = await db.transaction(async (tx) => {
      const [balanceRow] = await tx
        .select()
        .from(agentBalances)
        .where(eq(agentBalances.agentId, agent.id))
        .for("update");

      if (!balanceRow) {
        return { error: "Agent balance not found", status: 500 as const };
      }

      const balance = Number(balanceRow.balance);
      if (balance < inAmount) {
        return { error: "Insufficient balance", status: 400 as const };
      }

      const [existing] = await tx
        .select()
        .from(positions)
        .where(
          and(
            eq(positions.agentId, agent.id),
            eq(positions.marketTicker, parsed.marketTicker),
            eq(positions.side, parsed.side),
          ),
        )
        .for("update");

      const existingContracts = existing ? Number(existing.contracts) : 0;
      const existingAvgPrice = existing ? Number(existing.avgPrice) : 0;
      const newContracts = existingContracts + netContracts;
      const newAvgPrice =
        newContracts === 0
          ? pricePerContract
          : (existingContracts * existingAvgPrice + netContracts * pricePerContract) / newContracts;

      await tx
        .update(agentBalances)
        .set({ balance: formatNumeric(balance - inAmount), updatedAt: new Date() })
        .where(eq(agentBalances.agentId, agent.id));

      if (existing) {
        await tx
          .update(positions)
          .set({
            contracts: formatNumeric(newContracts),
            avgPrice: formatNumeric(newAvgPrice),
            updatedAt: new Date(),
          })
          .where(eq(positions.id, existing.id));
      } else {
        await tx.insert(positions).values({
          agentId: agent.id,
          marketTicker: parsed.marketTicker,
          side: parsed.side,
          contracts: formatNumeric(newContracts),
          avgPrice: formatNumeric(newAvgPrice),
        });
      }

      await tx.insert(trades).values({
        agentId: agent.id,
        marketTicker: parsed.marketTicker,
        side: parsed.side,
        tradeType: "BUY",
        dollarAmount: formatNumeric(inAmount),
        contracts: formatNumeric(netContracts),
        pricePerContract: formatNumeric(pricePerContract),
        feeAmount: formatNumeric(feeBreakdown.totalFee),
        dflowQuote: quote.body,
      });

      return {
        balanceBefore: balance,
        balanceAfter: balance - inAmount,
        netContracts,
        pricePerContract,
      };
    });

    if ("error" in result) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json({
      marketTicker: getMarketTicker(market) ?? parsed.marketTicker,
      side: parsed.side,
      amount: inAmount,
      contracts: result.netContracts,
      pricePerContract: result.pricePerContract,
      fee: feeBreakdown.totalFee,
      balance: result.balanceAfter,
      dflow: quote.body,
    });
  } catch (err) {
    if (err instanceof DFlowNetworkError) {
      return c.json({ error: err.message }, 502);
    }
    throw err;
  }
});

tradingRoutes.post("/sell", requireAgent, async (c) => {
  const parsed = await parseBody(c, sellTradeSchema);
  if (parsed instanceof Response) return parsed;

  if (!Number.isFinite(parsed.contracts) || parsed.contracts <= 0) {
    return c.json({ error: "contracts must be greater than 0" }, 400);
  }

  const agent = c.get("agent");
  const marketResult = await fetchMarket(parsed.marketTicker);
  if (marketResult.status !== 200 || !marketResult.market) {
    return c.json({ error: "Market not found" }, marketResult.status as 400 | 404);
  }

  const market = marketResult.market;
  const status = parseMarketStatus(market);
  if (status !== "active") {
    return c.json({ error: "Market is not active" }, 400);
  }

  const mints = pickOutcomeMints(market);
  if (!mints) {
    return c.json({ error: "Market outcome mints not found" }, 400);
  }
  if (!isOutcomeAccountInitialized(market, parsed.side, mints)) {
    return c.json({ error: "Market is not tradable (outcome account not initialized)" }, 400);
  }

  const inputMint = parsed.side === "YES" ? mints.yesMint : mints.noMint;
  const contractsScaled = Math.round(parsed.contracts * 1_000_000);

  try {
    const quote = await getOrderQuote(inputMint, env.USDC_MINT, contractsScaled);
    if (quote.status >= 400) {
      const errBody = dflowOrderErrorBody(quote.body as Record<string, unknown>);
      return c.json(errBody, quote.status as 400 | 500 | 503);
    }

    const { inputDecimals, outputDecimals } = resolveDecimals(quote.body.routePlan as Array<Record<string, unknown>>);
    const inContracts = scaledToNumber(quote.body.inAmount, inputDecimals);
    const outAmount = scaledToNumber(quote.body.outAmount, outputDecimals);
    if (outAmount <= 0) {
      return c.json({ error: "Invalid quote output amount" }, 400);
    }

    const pricePerContract = outAmount / inContracts;
    const feeBreakdown = calculateFeeBreakdown(inContracts, pricePerContract);
    const feeDollars = feeBreakdown.totalFee * pricePerContract;
    const netProceeds = outAmount - feeDollars;

    const result = await db.transaction(async (tx) => {
      const [balanceRow] = await tx
        .select()
        .from(agentBalances)
        .where(eq(agentBalances.agentId, agent.id))
        .for("update");

      if (!balanceRow) {
        return { error: "Agent balance not found", status: 500 as const };
      }

      const [existing] = await tx
        .select()
        .from(positions)
        .where(
          and(
            eq(positions.agentId, agent.id),
            eq(positions.marketTicker, parsed.marketTicker),
            eq(positions.side, parsed.side),
          ),
        )
        .for("update");

      if (!existing) {
        return { error: "Position not found", status: 400 as const };
      }

      const existingContracts = Number(existing.contracts);
      if (existingContracts < inContracts) {
        return { error: "Insufficient contracts", status: 400 as const };
      }

      const remainingContracts = existingContracts - inContracts;

      await tx
        .update(agentBalances)
        .set({
          balance: formatNumeric(Number(balanceRow.balance) + netProceeds),
          updatedAt: new Date(),
        })
        .where(eq(agentBalances.agentId, agent.id));

      if (remainingContracts <= 0) {
        await tx.delete(positions).where(eq(positions.id, existing.id));
      } else {
        await tx
          .update(positions)
          .set({ contracts: formatNumeric(remainingContracts), updatedAt: new Date() })
          .where(eq(positions.id, existing.id));
      }

      await tx.insert(trades).values({
        agentId: agent.id,
        marketTicker: parsed.marketTicker,
        side: parsed.side,
        tradeType: "SELL",
        dollarAmount: formatNumeric(netProceeds),
        contracts: formatNumeric(inContracts),
        pricePerContract: formatNumeric(pricePerContract),
        feeAmount: formatNumeric(feeBreakdown.totalFee),
        dflowQuote: quote.body,
      });

      return {
        balanceAfter: Number(balanceRow.balance) + netProceeds,
        netProceeds,
      };
    });

    if ("error" in result) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json({
      marketTicker: getMarketTicker(market) ?? parsed.marketTicker,
      side: parsed.side,
      contracts: inContracts,
      proceeds: result.netProceeds,
      pricePerContract,
      fee: feeBreakdown.totalFee,
      balance: result.balanceAfter,
      dflow: quote.body,
    });
  } catch (err) {
    if (err instanceof DFlowNetworkError) {
      return c.json({ error: err.message }, 502);
    }
    throw err;
  }
});

tradingRoutes.post("/redeem", requireAgent, async (c) => {
  const parsed = await parseBody(c, redeemTradeSchema);
  if (parsed instanceof Response) return parsed;

  const agent = c.get("agent");
  const marketResult = await fetchMarket(parsed.marketTicker);
  if (marketResult.status !== 200 || !marketResult.market) {
    return c.json({ error: "Market not found" }, marketResult.status as 400 | 404);
  }

  const market = marketResult.market;
  const status = parseMarketStatus(market);
  if (status !== "determined" && status !== "finalized") {
    return c.json({ error: "Market not resolved" }, 400);
  }

  const result = market.result;
  const marketResultValue = typeof result === "string" ? result.toUpperCase() : "UNKNOWN";
  if (marketResultValue !== "YES" && marketResultValue !== "NO") {
    return c.json({ error: "Market result unavailable" }, 400);
  }

  const existingPositions = await db
    .select()
    .from(positions)
    .where(
      and(
        eq(positions.agentId, agent.id),
        eq(positions.marketTicker, parsed.marketTicker),
      ),
    );

  if (existingPositions.length === 0) {
    return c.json({ error: "No positions to redeem" }, 400);
  }

  const winningSide = marketResultValue;

  const payoutContracts = existingPositions
    .filter((position) => position.side === winningSide)
    .reduce((sum, position) => sum + Number(position.contracts), 0);

  const payoutAmount = payoutContracts;

  await db.transaction(async (tx) => {
    const [balanceRow] = await tx
      .select()
      .from(agentBalances)
      .where(eq(agentBalances.agentId, agent.id))
      .for("update");

    if (!balanceRow) {
      throw new Error("Agent balance not found");
    }

    await tx
      .update(agentBalances)
      .set({
        balance: formatNumeric(Number(balanceRow.balance) + payoutAmount),
        updatedAt: new Date(),
      })
      .where(eq(agentBalances.agentId, agent.id));

    await tx
      .delete(positions)
      .where(
        and(
          eq(positions.agentId, agent.id),
          eq(positions.marketTicker, parsed.marketTicker),
        ),
      );

    for (const position of existingPositions) {
      await tx.insert(redemptions).values({
        agentId: agent.id,
        marketTicker: parsed.marketTicker,
        side: position.side,
        contractsRedeemed: formatNumeric(Number(position.contracts)),
        payoutAmount: formatNumeric(
          position.side === winningSide ? Number(position.contracts) : 0,
        ),
        marketResult: marketResultValue,
      });
    }
  });

  return c.json({
    marketTicker: getMarketTicker(market) ?? parsed.marketTicker,
    result: marketResultValue,
    payout: payoutAmount,
  });
});

tradingRoutes.get("/positions", requireAgent, async (c) => {
  const agent = c.get("agent");
  const rows = await db
    .select()
    .from(positions)
    .where(eq(positions.agentId, agent.id));

  return c.json({ positions: rows });
});

tradingRoutes.get("/portfolio", requireAgent, async (c) => {
  const agent = c.get("agent");
  const [balanceRow] = await db
    .select()
    .from(agentBalances)
    .where(eq(agentBalances.agentId, agent.id));

  if (!balanceRow) {
    return c.json({ error: "Agent balance not found" }, 500);
  }

  const rows = await db
    .select()
    .from(positions)
    .where(eq(positions.agentId, agent.id));

  const values = [];
  let positionsValue = 0;

  for (const row of rows) {
    const marketResult = await fetchMarket(row.marketTicker);
    if (marketResult.status !== 200 || !marketResult.market) {
      values.push({ ...row, value: 0, price: null });
      continue;
    }

    const market = marketResult.market;
    const price = getMarketPrice(market, row.side as "YES" | "NO");
    const value = Number(row.contracts) * (price ?? 0);
    positionsValue += value;
    values.push({ ...row, value, price });
  }

  const balance = Number(balanceRow.balance);
  return c.json({
    balance,
    positionsValue,
    totalValue: balance + positionsValue,
    positions: values,
  });
});
