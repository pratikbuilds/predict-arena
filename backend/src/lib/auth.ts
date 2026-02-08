import { createHash } from "node:crypto";
import type { Context, Next } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { agents } from "../db/schema.js";
import type { Agent } from "../db/schema.js";

export type AgentVariables = { agent: Agent };

type AuthEnv = { Variables: AgentVariables };

export function hashApiKey(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

function getBearerToken(c: Context): string | null {
  const header = c.req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

/**
 * Middleware: require `Authorization: Bearer <apiKey>` and resolve to an agent.
 * On success sets `c.set('agent', agent)` and calls next().
 * On missing/invalid key returns 401 with `{ error: "..." }`.
 */
export async function requireAgent(c: Context<AuthEnv>, next: Next) {
  const token = getBearerToken(c);
  if (!token) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const apiKeyHash = hashApiKey(token);
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.apiKeyHash, apiKeyHash))
    .limit(1);

  if (!agent) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  c.set("agent", agent);
  await next();
}
