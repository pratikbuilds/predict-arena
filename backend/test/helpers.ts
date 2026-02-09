import { app } from "../src/app.js";
import { db } from "../src/db/client.js";
import { agents } from "../src/db/schema.js";

/**
 * Registers a fresh agent and returns its API key. Useful for tests that need
 * to call protected routes. Cleans up the agent after by default.
 */
export async function getTestApiKey(name?: string): Promise<string> {
  const res = await app.request("/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name ?? `test-agent-${Date.now()}` }),
  });
  if (res.status !== 200) {
    const body = (await res.json()) as { error?: string };
    throw new Error(`Failed to register agent: ${body.error ?? res.status}`);
  }
  const data = (await res.json()) as { apiKey: string };
  return data.apiKey;
}

/**
 * Cleans up all agents from the database. Call in afterEach/afterAll if needed.
 */
export async function cleanupAgents(): Promise<void> {
  await db.delete(agents);
}
