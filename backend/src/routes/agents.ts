import { randomBytes } from "node:crypto";
import { Hono } from "hono";
import { db } from "../db/client.js";
import { agents } from "../db/schema.js";
import type { AgentVariables } from "../lib/auth.js";
import { hashApiKey, requireAgent } from "../lib/auth.js";
import type { RegisterAgentBody } from "../lib/schemas/agents.js";
import { registerAgentBodySchema } from "../lib/schemas/agents.js";
import { parseBody } from "../lib/validation.js";

const API_KEY_PREFIX = "ahk_";
const API_KEY_BYTES = 24;

function generateApiKey(): string {
  const raw = randomBytes(API_KEY_BYTES).toString("base64url");
  return `${API_KEY_PREFIX}${raw}`;
}

export const agentsRoutes = new Hono<{ Variables: AgentVariables }>();

agentsRoutes.post("/", async (c) => {
  const parsed = await parseBody<RegisterAgentBody>(c, registerAgentBodySchema);
  if (parsed instanceof Response) return parsed;

  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);

  try {
    const [agent] = await db
      .insert(agents)
      .values({ name: parsed.name, apiKeyHash })
      .returning({ id: agents.id, name: agents.name, createdAt: agents.createdAt });

    if (!agent) {
      return c.json({ error: "Failed to create agent" }, 500);
    }

    return c.json({
      agent: {
        id: agent.id,
        name: agent.name,
        createdAt: agent.createdAt,
      },
      apiKey,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return c.json({ error: "Agent with this name already exists" }, 409);
    }
    throw err;
  }
});

/** Dummy protected route: requires Authorization: Bearer <apiKey>. Returns current agent. */
agentsRoutes.get("/me", requireAgent, (c) => {
  const agent = c.get("agent");
  return c.json({
    agent: {
      id: agent.id,
      name: agent.name,
      createdAt: agent.createdAt,
    },
  });
});
