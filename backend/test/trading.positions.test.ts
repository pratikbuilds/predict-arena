import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config.js";
import { getTestApiKey, cleanupAgents } from "./helpers.js";
import { logSection, logKV, logBlank } from "./logger.js";

async function fetchActiveMarketTicker() {
  const url = new URL("/api/v1/markets", env.DFLOW_METADATA_API_URL);
  url.searchParams.set("status", "active");
  url.searchParams.set("limit", "5");
  const res = await fetch(url.toString());
  const body = (await res.json()) as { markets?: Array<Record<string, unknown>> };
  const markets = body.markets ?? [];
  const first = markets.find((market) => market.ticker);
  return first ? String(first.ticker) : null;
}

describe("GET /trading/positions + /trading/portfolio", () => {
  beforeEach(async () => {
    await cleanupAgents();
  });

  it("returns current positions and portfolio value", async () => {
    const marketTicker = await fetchActiveMarketTicker();
    if (!marketTicker) {
      console.warn("No active market found on DFlow dev API; skipping test.");
      return;
    }

    const apiKey = await getTestApiKey();
    const buyRes = await app.request("/trading/buy", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ marketTicker, side: "YES", amount: 5 }),
    });
    expect(buyRes.status).toBe(200);

    const positionsRes = await app.request("/trading/positions", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(positionsRes.status).toBe(200);
    const positionsData = (await positionsRes.json()) as { positions: Array<Record<string, unknown>> };

    logSection("Positions");
    logKV("count", positionsData.positions.length);
    logKV("first", JSON.stringify(positionsData.positions[0]));
    logBlank();

    const portfolioRes = await app.request("/trading/portfolio", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(portfolioRes.status).toBe(200);
    const portfolio = (await portfolioRes.json()) as {
      balance: number;
      positionsValue: number;
      totalValue: number;
    };

    logSection("Portfolio");
    logKV("balance", portfolio.balance);
    logKV("positionsValue", portfolio.positionsValue);
    logKV("totalValue", portfolio.totalValue);
    logBlank();

    expect(portfolio.totalValue).toBeGreaterThan(0);
  });
});
