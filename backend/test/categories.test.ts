import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { getTestApiKey, cleanupAgents } from "./helpers.js";

describe("GET /categories", () => {
  beforeEach(cleanupAgents);

  it("returns 401 without Authorization header", async () => {
    const res = await app.request("/categories", { method: "GET" });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Authorization/i);
  });

  it("returns 401 with invalid API key", async () => {
    const res = await app.request("/categories", {
      method: "GET",
      headers: { Authorization: "Bearer ahk_invalidkey123" },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Invalid API key/i);
  });

  it("returns 200 with valid API key; body has tagsByCategories", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request("/categories", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data).toHaveProperty("tagsByCategories");
    expect(typeof data.tagsByCategories).toBe("object");
  });
});
