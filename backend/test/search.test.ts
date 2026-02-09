import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { getTestApiKey, cleanupAgents } from "./helpers.js";

describe("GET /search", () => {
  beforeEach(cleanupAgents);

  it("returns 401 without Authorization header", async () => {
    const res = await app.request("/search?q=bitcoin", { method: "GET" });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Authorization/i);
  });

  it("returns 401 with invalid API key", async () => {
    const res = await app.request("/search?q=bitcoin", {
      method: "GET",
      headers: { Authorization: "Bearer ahk_invalidkey123" },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Invalid API key/i);
  });

  it("returns 400 when q is missing", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request("/search", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/q|required/i);
  });

  it("returns 200 with q=bitcoin; body has events and cursor", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request("/search?q=bitcoin", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { events?: unknown; cursor?: unknown };
    console.log("DATA", data);
    expect(data).toHaveProperty("events");
    expect(Array.isArray(data.events)).toBe(true);
    expect(data).toHaveProperty("cursor");
  });

  it("forwards optional params", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request(
      "/search?q=bitcoin&limit=3&sort=volume&order=desc",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { events: unknown[] };
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBeLessThanOrEqual(3);
  });
});
