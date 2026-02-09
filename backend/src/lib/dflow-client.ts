import { env } from "../config.js";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;

export class DFlowNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DFlowNetworkError";
  }
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>): string {
  const base = env.DFLOW_METADATA_API_URL.replace(/\/$/, "");
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

/**
 * GET request to DFlow Metadata API. Returns the Response for proxying.
 * Does not throw on 4xx/5xx; only throws on network/timeout errors.
 */
export async function dflowGet(
  path: string,
  queryParams?: Record<string, string | number | boolean | undefined | null>,
): Promise<Response> {
  const url = buildUrl(path, queryParams);
  return fetchWithRetry(url, { method: "GET" });
}

/**
 * POST request to DFlow Metadata API. Returns the Response for proxying.
 */
export async function dflowPost(path: string, body?: unknown): Promise<Response> {
  const base = env.DFLOW_METADATA_API_URL.replace(/\/$/, "");
  const url = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  return fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
  });
}
