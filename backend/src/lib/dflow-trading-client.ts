import { env } from "../config.js";
import { DFlowNetworkError } from "./dflow-client.js";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;

function buildTradingUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): string {
  const base = env.DFLOW_TRADING_API_URL.replace(/\/$/, "");
  const url = new URL(path.startsWith("/") ? path : `/${path}`, base);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit & { timeoutMs?: number; retries?: number },
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const { timeoutMs: _tm, retries: _r, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  if (env.DFLOW_API_KEY) {
    headers.set("x-api-key", env.DFLOW_API_KEY);
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      if (res.ok) return res;
      if ((res.status === 429 || res.status === 503) && attempt < retries) {
        const backoffMs = 500 * Math.pow(2, attempt);
        await sleep(backoffMs);
        continue;
      }
      return res;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        if (attempt < retries) continue;
        throw new DFlowNetworkError(`Request timed out after ${timeoutMs}ms`);
      }
      if (attempt < retries) continue;
      throw new DFlowNetworkError(
        err instanceof Error ? err.message : "Network error",
      );
    } finally {
      clearTimeout(timer);
    }
  }

  throw new DFlowNetworkError("Request failed after retries");
}

export async function dflowTradingGet(
  path: string,
  queryParams?: Record<string, string | number | boolean | undefined | null>,
): Promise<Response> {
  const url = buildTradingUrl(path, queryParams);
  return fetchWithRetry(url, { method: "GET" });
}

export type OrderQuote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  slippageBps: number;
  executionMode: "sync" | "async";
  routePlan?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

/**
 * GET /order – DFlow Trading API (https://pond.dflow.net/build/trading-api/order/order).
 * Returns a quote (and optionally a transaction if userPublicKey is provided).
 * @param amount - Input amount as a scaled integer (e.g. 6 decimals: 1 USDC = 1_000_000).
 */
export async function getOrderQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
): Promise<{ status: number; body: OrderQuote }> {
  const amountInt = Math.round(Number(amount));
  const res = await dflowTradingGet("/order", {
    inputMint,
    outputMint,
    amount: amountInt,
  });
  const body = (await res.json()) as OrderQuote;
  return { status: res.status, body };
}
