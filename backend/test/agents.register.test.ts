import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/db/client.js";
import { agents } from "../src/db/schema.js";

describe("POST /agents", () => {
  beforeEach(async () => {
    await db.delete(agents);
  });

  it("registers an agent and returns agent + apiKey", async () => {
    const res = await app.request("/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "my-agent" }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      agent: { id: string; name: string; createdAt: string };
      apiKey: string;
    };
    expect(data.agent).toBeDefined();
    expect(data.agent.name).toBe("my-agent");
    expect(data.agent.id).toBeDefined();
    expect(data.agent.createdAt).toBeDefined();
    expect(data.apiKey).toBeDefined();
    expect(typeof data.apiKey).toBe("string");
    expect(data.apiKey.startsWith("ahk_")).toBe(true);
  });

  it("returns 400 when name is missing", async () => {
    const res = await app.request("/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/name/i);
  });

  it("returns 400 when name is empty string", async () => {
    const res = await app.request("/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   " }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 409 when name already exists", async () => {
    const payload = JSON.stringify({ name: "duplicate-agent" });
    const res1 = await app.request("/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    expect(res1.status).toBe(200);

    const res2 = await app.request("/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    expect(res2.status).toBe(409);
    const body = (await res2.json()) as { error: string };
    expect(body.error).toMatch(/already exists/i);
  });

  it("stores apiKey as hash only (not plaintext)", async () => {
    const res = await app.request("/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "hash-check-agent" }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { agent: { id: string }; apiKey: string };
    const plainKey = data.apiKey;
    const rows = await db.select({ apiKeyHash: agents.apiKeyHash }).from(agents);
    expect(rows.length).toBe(1);
    expect(rows[0].apiKeyHash).not.toBe(plainKey);
    expect(rows[0].apiKeyHash).toHaveLength(64);
    expect(rows[0].apiKeyHash).toMatch(/^[a-f0-9]+$/);
  });
});

describe("GET /agents/me", () => {
  beforeEach(async () => {
    await db.delete(agents);
  });

  it("returns 401 without Authorization header", async () => {
    const res = await app.request("/agents/me", { method: "GET" });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Authorization/i);
  });

  it("returns 401 with invalid API key", async () => {
    const res = await app.request("/agents/me", {
      method: "GET",
      headers: { Authorization: "Bearer ahk_invalidkey123" },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Invalid API key/i);
  });

  it("returns current agent with valid API key", async () => {
    const reg = await app.request("/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "me-test-agent" }),
    });
    expect(reg.status).toBe(200);
    const regData = (await reg.json()) as {
      agent: { id: string; name: string };
      apiKey: string;
    };

    const res = await app.request("/agents/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${regData.apiKey}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      agent: { id: string; name: string; createdAt: string };
    };
    expect(data.agent.name).toBe("me-test-agent");
    expect(data.agent.id).toBe(regData.agent.id);
  });
});
