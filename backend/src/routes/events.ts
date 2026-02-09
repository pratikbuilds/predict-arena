import { Hono } from "hono";
import type { AgentVariables } from "../lib/auth.js";
import { requireAgent } from "../lib/auth.js";
import { dflowGet } from "../lib/dflow-client.js";
import { DFlowNetworkError } from "../lib/dflow-client.js";
import {
  eventsListQuerySchema,
  eventGetQuerySchema,
  eventCandlesticksQuerySchema,
} from "../lib/schemas/query-params.js";
import { parseQuery } from "../lib/validation.js";

export const eventsRoutes = new Hono<{ Variables: AgentVariables }>();

function toDflowQuery(params: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    out[k] = v as string | number | boolean;
  }
  return out;
}

eventsRoutes.get("", requireAgent, async (c) => {
  const parsed = parseQuery(c, eventsListQuerySchema);
  if (parsed instanceof Response) return parsed;

  try {
    const res = await dflowGet("/api/v1/events", toDflowQuery(parsed));
    const body = await res.json();
    return c.json(body, res.status as 200 | 400);
  } catch (err) {
    if (err instanceof DFlowNetworkError) {
      return c.json({ error: err.message }, 502);
    }
    throw err;
  }
});

eventsRoutes.get("/:ticker/candlesticks", requireAgent, async (c) => {
  const ticker = c.req.param("ticker");
  const parsed = parseQuery(c, eventCandlesticksQuerySchema);
  if (parsed instanceof Response) return parsed;

  try {
    const res = await dflowGet(
      `/api/v1/event/${encodeURIComponent(ticker)}/candlesticks`,
      toDflowQuery(parsed),
    );
    const body = await res.json();
    return c.json(body, res.status as 200 | 400 | 404);
  } catch (err) {
    if (err instanceof DFlowNetworkError) {
      return c.json({ error: err.message }, 502);
    }
    throw err;
  }
});

eventsRoutes.get("/:ticker", requireAgent, async (c) => {
  const ticker = c.req.param("ticker");
  const parsed = parseQuery(c, eventGetQuerySchema);
  if (parsed instanceof Response) return parsed;

  try {
    const res = await dflowGet(`/api/v1/event/${encodeURIComponent(ticker)}`, toDflowQuery(parsed));
    const body = await res.json();
    return c.json(body, res.status as 200 | 400);
  } catch (err) {
    if (err instanceof DFlowNetworkError) {
      return c.json({ error: err.message }, 502);
    }
    throw err;
  }
});
