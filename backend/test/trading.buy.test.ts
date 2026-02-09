import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config.js";
import { db } from "../src/db/client.js";
import { agentBalances, positions, trades } from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import { getTestApiKey, cleanupAgents } from "./helpers.js";
import { logSection, logKV, logBlank } from "./logger.js";
import { calculateFeeBreakdown } from "../src/lib/fees.js";

async function fetchActiveMarket() {
  const url = new URL("/api/v1/events", env.DFLOW_METADATA_API_URL);
  url.searchParams.set("withNestedMarkets", "true");
  url.searchParams.set("status", "active");
  url.searchParams.set("limit", "5");
  const res = await fetch(url.toString());
  const body = (await res.json()) as { events?: Array<Record<string, unknown>> };
  const events = body.events ?? [];
  for (const event of events) {
    const markets = Array.isArray(event.markets) ? event.markets : [];
    for (const market of markets) {
      const accounts = market.accounts ?? {};
      const accountValues = Object.values(accounts as Record<string, unknown>);
      for (const entry of accountValues) {
        if (!entry || typeof entry !== "object") continue;
        const info = entry as { yesMint?: string; noMint?: string };
        if (info.yesMint && info.noMint) {
          return {
            ticker: String(market.ticker),
            yesMint: info.yesMint,
            noMint: info.noMint,
            yesBid: market.yesBid,
            yesAsk: market.yesAsk,
            noBid: market.noBid,
            noAsk: market.noAsk,
            status: market.status,
          };
        }
      }
    }
  }
  return null;
}

function resolveDecimals(routePlan?: Array<Record<string, unknown>>) {
  if (!routePlan || routePlan.length === 0) {
    return { inputDecimals: 6, outputDecimals: 6 };
  }
  const first = routePlan[0] as Record<string, unknown>;
  const last = routePlan[routePlan.length - 1] as Record<string, unknown>;
  return {
    inputDecimals: Number(first.inputMintDecimals ?? 6),
    outputDecimals: Number(last.outputMintDecimals ?? 6),
  };
}

function scaledToNumber(value: string, decimals: number): number {
  return Number(value) / Math.pow(10, decimals);
}

describe("POST /trading/buy", () => {
  beforeEach(async () => {
    await cleanupAgents();
  });

  it("buys outcome tokens and logs DFlow response + fee calculations", async () => {
    const market = await fetchActiveMarket();
    if (!market) {
      console.warn("No active market found on DFlow dev API; skipping test.");
      return;
    }

    logSection("DFlow Market Lookup");
    logKV("ticker", market.ticker);
    logKV("status", market.status);
    logKV("yesMint", market.yesMint);
    logKV("noMint", market.noMint);
    logKV("yesBid", market.yesBid);
    logKV("yesAsk", market.yesAsk);
    logKV("noBid", market.noBid);
    logKV("noAsk", market.noAsk);
    logBlank();

    const apiKey = await getTestApiKey();
    const [preBalance] = await db.select().from(agentBalances);
    logSection("Pre-Buy DB Snapshot");
    logKV("balance", preBalance?.balance);
    logBlank();
    const res = await app.request("/trading/buy", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ marketTicker: market.ticker, side: "YES", amount: 5 }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      dflow: Record<string, unknown>;
      amount: number;
      contracts: number;
      pricePerContract: number;
      fee: number;
      balance: number;
    };

    logSection("DFlow Trading Quote");
    const quote = data.dflow;
    logKV("inputMint", quote.inputMint);
    logKV("outputMint", quote.outputMint);
    logKV("inAmount", quote.inAmount);
    logKV("outAmount", quote.outAmount);
    logKV("priceImpactPct", quote.priceImpactPct);
    logKV("slippageBps", quote.slippageBps);
    logKV("executionMode", quote.executionMode);
    logKV("routePlan", JSON.stringify(quote.routePlan));
    logBlank();

    const { inputDecimals, outputDecimals } = resolveDecimals(quote.routePlan as Array<Record<string, unknown>>);
    const inAmount = scaledToNumber(String(quote.inAmount), inputDecimals);
    const outContracts = scaledToNumber(String(quote.outAmount), outputDecimals);
    const price = inAmount / outContracts;
    const fee = calculateFeeBreakdown(outContracts, price);
    const netContracts = outContracts - fee.totalFee;

    logSection("Fee Calculation");
    logKV("contracts (c)", outContracts);
    logKV("price (p)", price);
    logKV("p*(1-p)", fee.probabilityFactor);
    logKV("component1", fee.component1);
    logKV("component2", fee.component2);
    logKV("totalFee", fee.totalFee);
    logKV("netContracts", netContracts);
    logBlank();

    const [balanceRow] = await db.select().from(agentBalances);
    const [positionRow] = await db
      .select()
      .from(positions)
      .where(eq(positions.marketTicker, market.ticker));
    const [tradeRow] = await db.select().from(trades);

    logSection("Balance & Position Update");
    logKV("balance after", balanceRow?.balance);
    logKV("position contracts", positionRow?.contracts);
    logKV("position avgPrice", positionRow?.avgPrice);
    logKV("trade contracts", tradeRow?.contracts);
    logKV("trade fee", tradeRow?.feeAmount);
    logKV("trade row", JSON.stringify(tradeRow));
    logBlank();

    expect(data.contracts).toBeCloseTo(netContracts, 5);
    expect(data.fee).toBeCloseTo(fee.totalFee, 5);
    expect(Number(balanceRow?.balance)).toBeCloseTo(1000 - inAmount, 5);
    expect(Number(positionRow?.contracts)).toBeCloseTo(netContracts, 5);
  });
});
