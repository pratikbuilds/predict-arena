import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { getTestApiKey, cleanupAgents } from "./helpers.js";

describe("GET /series", () => {
  beforeEach(cleanupAgents);

  it("returns 401 without Authorization header", async () => {
    const res = await app.request("/series", { method: "GET" });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Authorization/i);
  });

  it("returns 401 with invalid API key", async () => {
    const res = await app.request("/series", {
      method: "GET",
      headers: { Authorization: "Bearer ahk_invalidkey123" },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Invalid API key/i);
  });

  it("returns 200; body has series (array)", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request("/series", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { series?: unknown };
    expect(data).toHaveProperty("series");
    expect(Array.isArray(data.series)).toBe(true);
  });

  it("returns 200 with query params forwarded", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request(
      "/series?category=Sports&tags=Football",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { series: unknown[] };
    expect(Array.isArray(data.series)).toBe(true);
  });
});
