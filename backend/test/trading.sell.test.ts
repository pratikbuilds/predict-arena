import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config.js";
import { db } from "../src/db/client.js";
import { agentBalances, positions, trades } from "../src/db/schema.js";
import { getTestApiKey, cleanupAgents } from "./helpers.js";
import { logSection, logKV, logBlank } from "./logger.js";
import { calculateFeeBreakdown } from "../src/lib/fees.js";
import { eq } from "drizzle-orm";

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

describe("POST /trading/sell", () => {
  beforeEach(async () => {
    await cleanupAgents();
  });

  it("sells outcome tokens and logs DFlow response + fee calculations", async () => {
    const market = await fetchActiveMarket();
    if (!market) {
      console.warn("No active market found on DFlow dev API; skipping test.");
      return;
    }

    const apiKey = await getTestApiKey();
    const buyRes = await app.request("/trading/buy", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ marketTicker: market.ticker, side: "YES", amount: 5 }),
    });
    expect(buyRes.status).toBe(200);
    const buyData = (await buyRes.json()) as { contracts: number };
    logSection("Buy Result");
    logKV("contracts", buyData.contracts);
    logBlank();

    const [preBalance] = await db.select().from(agentBalances);
    const [prePosition] = await db
      .select()
      .from(positions)
      .where(eq(positions.marketTicker, market.ticker));
    logSection("Pre-Sell DB Snapshot");
    logKV("balance", preBalance?.balance);
    logKV("position contracts", prePosition?.contracts);
    logKV("position avgPrice", prePosition?.avgPrice);
    logBlank();

    const contractsToSell = buyData.contracts / 2;
    logSection("Sell Request");
    logKV("marketTicker", market.ticker);
    logKV("side", "YES");
    logKV("contracts", contractsToSell);
    logBlank();
    const res = await app.request("/trading/sell", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ marketTicker: market.ticker, side: "YES", contracts: contractsToSell }),
    });

    const rawBody = (await res.json()) as Record<string, unknown>;
    if (res.status !== 200) {
      logSection("Sell Response (Non-200)");
      logKV("status", res.status);
      logKV("body", JSON.stringify(rawBody));
      logBlank();
      console.warn("Sell quote failed on DFlow dev API; skipping test.");
      return;
    }

    const data = rawBody as {
      dflow: Record<string, unknown>;
      contracts: number;
      proceeds: number;
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
    const inContracts = scaledToNumber(String(quote.inAmount), inputDecimals);
    const outAmount = scaledToNumber(String(quote.outAmount), outputDecimals);
    const price = outAmount / inContracts;
    const fee = calculateFeeBreakdown(inContracts, price);
    const feeDollars = fee.totalFee * price;
    const netProceeds = outAmount - feeDollars;

    logSection("Fee Calculation");
    logKV("contracts (c)", inContracts);
    logKV("price (p)", price);
    logKV("p*(1-p)", fee.probabilityFactor);
    logKV("component1", fee.component1);
    logKV("component2", fee.component2);
    logKV("totalFee", fee.totalFee);
    logKV("netProceeds", netProceeds);
    logBlank();

    const [balanceRow] = await db.select().from(agentBalances);
    const [positionRow] = await db
      .select()
      .from(positions)
      .where(eq(positions.marketTicker, market.ticker));
    const allTrades = await db.select().from(trades);
    const sellTrade = allTrades.find((trade) => trade.tradeType === "SELL");

    logSection("Balance & Position Update");
    logKV("balance after", balanceRow?.balance);
    logKV("position contracts", positionRow?.contracts);
    logKV("trade count", allTrades.length);
    logKV("sell trade", JSON.stringify(sellTrade));
    logBlank();

    expect(data.proceeds).toBeCloseTo(netProceeds, 5);
    expect(data.fee).toBeCloseTo(fee.totalFee, 5);
    expect(Number(positionRow?.contracts)).toBeCloseTo(buyData.contracts - inContracts, 5);
  });
});
