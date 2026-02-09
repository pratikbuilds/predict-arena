import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config.js";
import { db } from "../src/db/client.js";
import { agents, agentBalances, positions } from "../src/db/schema.js";
import { cleanupAgents, getTestApiKey } from "./helpers.js";
import { logSection, logKV, logBlank } from "./logger.js";
import { eq } from "drizzle-orm";

async function fetchResolvedMarket() {
  const url = new URL("/api/v1/markets", env.DFLOW_METADATA_API_URL);
  url.searchParams.set("status", "determined");
  url.searchParams.set("limit", "10");
  const res = await fetch(url.toString());
  const body = (await res.json()) as { markets?: Array<Record<string, unknown>> };
  const markets = body.markets ?? [];
  for (const market of markets) {
    const result = String(market.result ?? "").toUpperCase();
    if (result === "YES" || result === "NO") {
      return { ticker: String(market.ticker), result };
    }
  }
  return null;
}

describe("POST /trading/redeem", () => {
  beforeEach(async () => {
    await cleanupAgents();
  });

  it("redeems winning positions and logs payout details", async () => {
    const market = await fetchResolvedMarket();
    if (!market) {
      console.warn("No determined market found on DFlow dev API; skipping test.");
      return;
    }

    const apiKey = await getTestApiKey();
    const [agentRow] = await db.select().from(agents);
    if (!agentRow) {
      throw new Error("Agent not found");
    }

    await db.insert(positions).values([
      {
        agentId: agentRow.id,
        marketTicker: market.ticker,
        side: "YES",
        contracts: "10.000000",
        avgPrice: "0.600000",
      },
      {
        agentId: agentRow.id,
        marketTicker: market.ticker,
        side: "NO",
        contracts: "5.000000",
        avgPrice: "0.400000",
      },
    ]);

    logSection("Market Resolution");
    logKV("ticker", market.ticker);
    logKV("result", market.result);
    logBlank();

    const res = await app.request("/trading/redeem", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ marketTicker: market.ticker }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { payout: number; result: string };

    const [balanceRow] = await db
      .select()
      .from(agentBalances)
      .where(eq(agentBalances.agentId, agentRow.id));

    logSection("Payout");
    logKV("payout", data.payout);
    logKV("balance after", balanceRow?.balance);
    logBlank();

    const expectedPayout = market.result === "YES" ? 10 : 5;
    expect(data.payout).toBeCloseTo(expectedPayout, 5);
    expect(Number(balanceRow?.balance)).toBeCloseTo(1000 + expectedPayout, 5);
  });
});
