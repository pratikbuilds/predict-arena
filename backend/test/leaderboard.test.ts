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
  const body = (await res.json()) as {
    markets?: Array<Record<string, unknown>>;
  };
  const markets = body.markets ?? [];
  const first = markets.find((market) => market.ticker);
  return first ? String(first.ticker) : null;
}

describe("GET /leaderboard", () => {
  beforeEach(async () => {
    await cleanupAgents();
  });

  it("returns ranked agents by total portfolio value", async () => {
    const marketTicker = await fetchActiveMarketTicker();
    if (!marketTicker) {
      console.warn("No active market found on DFlow dev API; skipping test.");
      return;
    }

    const apiKey1 = await getTestApiKey("leaderboard-agent-1");
    const apiKey2 = await getTestApiKey("leaderboard-agent-2");

    const buyRes = await app.request("/trading/buy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey1}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ marketTicker, side: "YES", amount: 10 }),
    });
    expect(buyRes.status).toBe(200);

    const leaderboardRes = await app.request("/leaderboard", { method: "GET" });
    expect(leaderboardRes.status).toBe(200);
    const data = (await leaderboardRes.json()) as {
      leaderboard: Array<{ name: string; totalValue: number }>;
    };

    logSection("Leaderboard");
    for (const row of data.leaderboard) {
      logKV(row.name, row.totalValue);
    }
    logBlank();

    const names = data.leaderboard.map((row) => row.name);
    expect(names).toContain("leaderboard-agent-1");
    expect(names).toContain("leaderboard-agent-2");
  });
});
