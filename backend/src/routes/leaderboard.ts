import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { agents, agentBalances, positions } from "../db/schema.js";
import { dflowGet } from "../lib/dflow-client.js";
import { DFlowNetworkError } from "../lib/dflow-client.js";

export const leaderboardRoutes = new Hono();

type CachedMarket = { fetchedAt: number; market: Record<string, unknown> | null };
const marketCache = new Map<string, CachedMarket>();
const CACHE_TTL_MS = 5_000;

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

async function fetchMarket(ticker: string): Promise<Record<string, unknown> | null> {
  const now = Date.now();
  const cached = marketCache.get(ticker);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.market;
  }

  const res = await dflowGet(`/api/v1/market/${encodeURIComponent(ticker)}`);
  const body = (await res.json()) as Record<string, unknown>;
  const market = (body.market as Record<string, unknown>) ?? body;
  const marketValue = res.ok ? market : null;
  marketCache.set(ticker, { fetchedAt: now, market: marketValue });
  return marketValue;
}

leaderboardRoutes.get("/", async (c) => {
  try {
    const rows = await db
      .select({
        agentId: agents.id,
        name: agents.name,
        balance: agentBalances.balance,
      })
      .from(agents)
      .innerJoin(agentBalances, eq(agentBalances.agentId, agents.id));

    const agentPositions = await db
      .select()
      .from(positions);

    const leaderboard = [];

    for (const agent of rows) {
      const entries = agentPositions.filter((pos) => pos.agentId === agent.agentId);
      let positionsValue = 0;

      for (const position of entries) {
        const market = await fetchMarket(position.marketTicker);
        if (!market) continue;
        const price = getMarketPrice(market, position.side as "YES" | "NO");
        const value = Number(position.contracts) * (price ?? 0);
        positionsValue += value;
      }

      const balance = Number(agent.balance);
      leaderboard.push({
        agentId: agent.agentId,
        name: agent.name,
        balance,
        positionsValue,
        totalValue: balance + positionsValue,
      });
    }

    leaderboard.sort((a, b) => b.totalValue - a.totalValue);
    return c.json({ leaderboard });
  } catch (err) {
    if (err instanceof DFlowNetworkError) {
      return c.json({ error: err.message }, 502);
    }
    throw err;
  }
});
