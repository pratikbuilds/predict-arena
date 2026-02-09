import { Hono } from "hono";
import type { AgentVariables } from "../lib/auth.js";
import { requireAgent } from "../lib/auth.js";
import { dflowGet } from "../lib/dflow-client.js";
import { DFlowNetworkError } from "../lib/dflow-client.js";
import { marketsListQuerySchema } from "../lib/schemas/query-params.js";
import { parseQuery } from "../lib/validation.js";

export const marketsRoutes = new Hono<{ Variables: AgentVariables }>();

function toDflowQuery(params: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    out[k] = v as string | number | boolean;
  }
  return out;
}

marketsRoutes.get("", requireAgent, async (c) => {
  const parsed = parseQuery(c, marketsListQuerySchema);
  if (parsed instanceof Response) return parsed;

  try {
    const res = await dflowGet("/api/v1/markets", toDflowQuery(parsed));
    const body = await res.json();
    return c.json(body, res.status as 200 | 400);
  } catch (err) {
    if (err instanceof DFlowNetworkError) {
      return c.json({ error: err.message }, 502);
    }
    throw err;
  }
});

// Register before /:ticker to avoid "by-mint" being captured as ticker
marketsRoutes.get("/by-mint/:mint", requireAgent, async (c) => {
  const mint = c.req.param("mint");
  try {
    const res = await dflowGet(`/api/v1/market/by-mint/${encodeURIComponent(mint)}`);
    const body = await res.json();
    return c.json(body, res.status as 200 | 400);
  } catch (err) {
    if (err instanceof DFlowNetworkError) {
      return c.json({ error: err.message }, 502);
    }
    throw err;
  }
});

marketsRoutes.get("/:ticker/orderbook", requireAgent, async (c) => {
  const ticker = c.req.param("ticker");
  try {
    const res = await dflowGet(`/api/v1/orderbook/${encodeURIComponent(ticker)}`);
    const body = await res.json();
    return c.json(body, res.status as 200 | 400);
  } catch (err) {
    if (err instanceof DFlowNetworkError) {
      return c.json({ error: err.message }, 502);
    }
    throw err;
  }
});

marketsRoutes.get("/:ticker", requireAgent, async (c) => {
  const ticker = c.req.param("ticker");
  try {
    const res = await dflowGet(`/api/v1/market/${encodeURIComponent(ticker)}`);
    const body = await res.json();
    return c.json(body, res.status as 200 | 400);
  } catch (err) {
    if (err instanceof DFlowNetworkError) {
      return c.json({ error: err.message }, 502);
    }
    throw err;
  }
});
