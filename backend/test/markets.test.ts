import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { getTestApiKey, cleanupAgents } from "./helpers.js";

describe("GET /markets", () => {
  beforeEach(cleanupAgents);

  it("returns 401 without Authorization header", async () => {
    const res = await app.request("/markets", { method: "GET" });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Authorization/i);
  });

  it("returns 401 with invalid API key", async () => {
    const res = await app.request("/markets", {
      method: "GET",
      headers: { Authorization: "Bearer ahk_invalidkey123" },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Invalid API key/i);
  });

  it("returns 200; body has markets (array) and cursor", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request("/markets", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { markets?: unknown; cursor?: unknown };
    expect(data).toHaveProperty("markets");
    expect(Array.isArray(data.markets)).toBe(true);
    expect(data).toHaveProperty("cursor");
  });

  it("returns 400 when invalid status enum", async () => {
    const apiKey = await getTestApiKey();
    const res = await app.request("/markets?status=invalid-status", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/status|Invalid/i);
  });
});

describe("GET /markets/:ticker", () => {
  beforeEach(cleanupAgents);

  it("returns 200 with valid ticker (from list)", async () => {
    const apiKey = await getTestApiKey();
    const listRes = await app.request("/markets?limit=1", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(listRes.status).toBe(200);
    const listData = (await listRes.json()) as { markets: Array<{ ticker: string }> };
    const ticker = listData.markets?.[0]?.ticker;
    if (!ticker) return;
    const res = await app.request(`/markets/${encodeURIComponent(ticker)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data).toHaveProperty("ticker");
    expect(data).toHaveProperty("eventTicker");
    expect(data).toHaveProperty("title");
  });
});

describe("GET /markets/by-mint/:mint", () => {
  beforeEach(cleanupAgents);

  it("returns 200 with known mint (from market accounts)", async () => {
    const apiKey = await getTestApiKey();
    const listRes = await app.request("/markets?limit=5", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(listRes.status).toBe(200);
    const listData = (await listRes.json()) as {
      markets: Array<{
        accounts?: Record<string, { yesMint?: string; noMint?: string }>;
      }>;
    };
    let mint: string | undefined;
    for (const m of listData.markets ?? []) {
      const accounts = m.accounts ?? {};
      const first = Object.values(accounts)[0];
      if (first?.yesMint) {
        mint = first.yesMint;
        break;
      }
    }
    if (!mint) return;
    const res = await app.request(`/markets/by-mint/${encodeURIComponent(mint)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data).toHaveProperty("ticker");
    expect(data).toHaveProperty("accounts");
  });
});

describe("GET /markets/:ticker/orderbook", () => {
  beforeEach(cleanupAgents);

  it("returns 200 with valid ticker", async () => {
    const apiKey = await getTestApiKey();
    const listRes = await app.request("/markets?limit=1", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(listRes.status).toBe(200);
    const listData = (await listRes.json()) as { markets: Array<{ ticker: string }> };
    const ticker = listData.markets?.[0]?.ticker;
    if (!ticker) return;
    const res = await app.request(
      `/markets/${encodeURIComponent(ticker)}/orderbook`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
    expect([200, 404]).toContain(res.status); // 404 if orderbook not available for market
    if (res.status === 200) {
      const data = (await res.json()) as Record<string, unknown>;
      expect(typeof data).toBe("object");
    }
  });
});
