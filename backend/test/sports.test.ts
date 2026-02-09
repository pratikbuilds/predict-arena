import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { getTestApiKey, cleanupAgents } from "./helpers.js";

describe("GET /sports/filters", () => {
  beforeEach(cleanupAgents);

  it("returns 401 without Authorization header", async () => {
    const res = await app.request("/sports/filters", { method: "GET" });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Authorization/i);
  });

  it("returns 401 with invalid API key", async () => {
    const res = await app.request("/sports/filters", {
      method: "GET",
      headers: { Authorization: "Bearer ahk_invalidkey123" },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Invalid API key/i);
  });

  it("returns 200; body has filtersBySports and sportOrdering", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request("/sports/filters", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      filtersBySports?: unknown;
      sportOrdering?: unknown;
    };
    expect(data).toHaveProperty("filtersBySports");
    expect(data).toHaveProperty("sportOrdering");
    expect(Array.isArray(data.sportOrdering)).toBe(true);
  });
});
