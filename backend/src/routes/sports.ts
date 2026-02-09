import { Hono } from "hono";
import type { AgentVariables } from "../lib/auth.js";
import { requireAgent } from "../lib/auth.js";
import { dflowGet } from "../lib/dflow-client.js";
import { DFlowNetworkError } from "../lib/dflow-client.js";

export const sportsRoutes = new Hono<{ Variables: AgentVariables }>();

sportsRoutes.get("/filters", requireAgent, async (c) => {
  try {
    const res = await dflowGet("/api/v1/filters_by_sports");
    const body = await res.json();
    return c.json(body, res.status as 200 | 400);
  } catch (err) {
    if (err instanceof DFlowNetworkError) {
      return c.json({ error: err.message }, 502);
    }
    throw err;
  }
});
