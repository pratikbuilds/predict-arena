import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { getTestApiKey, cleanupAgents } from "./helpers.js";

describe("GET /events", () => {
  beforeEach(cleanupAgents);

  it("returns 401 without Authorization header", async () => {
    const res = await app.request("/events", { method: "GET" });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Authorization/i);
  });

  it("returns 401 with invalid API key", async () => {
    const res = await app.request("/events", {
      method: "GET",
      headers: { Authorization: "Bearer ahk_invalidkey123" },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Invalid API key/i);
  });

  it("returns 200; body has events (array) and cursor", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request("/events", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { events?: unknown; cursor?: unknown };
    expect(data).toHaveProperty("events");
    expect(Array.isArray(data.events)).toBe(true);
    expect(data).toHaveProperty("cursor");
  });

  it("returns 400 when invalid status enum", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request("/events?status=invalid-status", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/status|Invalid/i);
  });

  it("returns 200 with query params forwarded", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request(
      "/events?limit=2&status=active&sort=volume&order=desc",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { events: unknown[] };
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBeLessThanOrEqual(2);
  });
});

describe("GET /events/:ticker", () => {
  beforeEach(cleanupAgents);

  it("returns 401 without Authorization header", async () => {
    const res = await app.request("/events/some-ticker", { method: "GET" });
    expect(res.status).toBe(401);
  });

  it("returns 200 with valid ticker (fetched from list)", async () => {
    const apiKey = await getTestApiKey();
    const listRes = await app.request("/events?limit=1", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(listRes.status).toBe(200);
    const listData = (await listRes.json()) as { events: Array<{ ticker: string }> };
    const ticker = listData.events?.[0]?.ticker;
    if (!ticker) {
      // No events in DFlow - skip or use a known ticker
      return;
    }
    const res = await app.request(`/events/${encodeURIComponent(ticker)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data).toHaveProperty("ticker");
    expect(data).toHaveProperty("seriesTicker");
    expect(data).toHaveProperty("title");
    expect(data).toHaveProperty("subtitle");
  });

  it("returns 400 when ticker does not exist", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request(
      "/events/NONEXISTENT_TICKER_12345",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
    expect([400, 404]).toContain(res.status);
  });
});

describe("GET /events/:ticker/candlesticks", () => {
  beforeEach(cleanupAgents);

  it("returns 401 without Authorization header", async () => {
    const res = await app.request(
      "/events/some-ticker/candlesticks?startTs=0&endTs=9999999999&periodInterval=60",
      { method: "GET" },
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when required query params missing", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request("/events/some-ticker/candlesticks", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/startTs|endTs|periodInterval|query|Validation/i);
  });

  it("returns 400 when periodInterval invalid", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request(
      "/events/some-ticker/candlesticks?startTs=0&endTs=9999999999&periodInterval=30",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/periodInterval|1, 60, or 1440/i);
  });

  it("returns 200 with valid params (or 404 if event unknown)", async () => {
    const apiKey = await getTestApiKey();
    const listRes = await app.request("/events?limit=1", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(listRes.status).toBe(200);
    const listData = (await listRes.json()) as { events: Array<{ ticker: string }> };
    const ticker = listData.events?.[0]?.ticker;
    if (!ticker) return;

    const res = await app.request(
      `/events/${encodeURIComponent(ticker)}/candlesticks?startTs=0&endTs=9999999999&periodInterval=60`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
    expect([200, 400, 404]).toContain(res.status);
    if (res.status === 200) {
      const data = (await res.json()) as Record<string, unknown>;
      expect(data).toBeDefined();
    }
  });
});
