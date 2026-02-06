import { getApiKey } from "../utils/config";

export class ApiError extends Error {
  status: number;
  url: string;
  body: unknown;

  constructor(message: string, status: number, url: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export interface RequestOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;

function buildUrl(baseUrl: string, path: string, query?: RequestOptions["query"]) {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestJson<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(baseUrl, path, options.query);
  const method = options.method ?? "GET";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const apiKey = getApiKey();

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };
  if (apiKey) headers["x-api-key"] = apiKey;
  if (method !== "GET") headers["content-type"] = "application/json";

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: method === "GET" ? undefined : JSON.stringify(options.body ?? {}),
        signal: controller.signal,
      });

      const text = await res.text();
      const body = text.length ? safeJsonParse(text) : null;

      if (res.ok) return body as T;

      if ((res.status === 429 || res.status === 503) && attempt < retries) {
        const backoffMs = 500 * Math.pow(2, attempt);
        await sleep(backoffMs);
        continue;
      }

      throw new ApiError(
        `Request failed (${res.status})`,
        res.status,
        url,
        body,
      );
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        if (attempt < retries) continue;
        throw new NetworkError(`Request timed out after ${timeoutMs}ms`);
      }
      if (attempt < retries) continue;
      throw new NetworkError(
        err instanceof Error ? err.message : "Network error",
      );
    } finally {
      clearTimeout(timer);
    }
  }

  throw new NetworkError("Request failed after retries");
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
