//#region src/utils/config.ts
const DEFAULT_METADATA_API_BASE = "https://dev-prediction-markets-api.dflow.net";
const DEFAULT_TRADE_API_BASE = "https://dev-quote-api.dflow.net";
function getMetadataApiBase() {
	return process.env.METADATA_API_BASE || process.env.DFLOW_METADATA_API_URL || DEFAULT_METADATA_API_BASE;
}
function getTradeApiBase() {
	return process.env.TRADE_API_BASE || process.env.DFLOW_TRADE_API_URL || DEFAULT_TRADE_API_BASE;
}
function getApiKey() {
	return process.env.DFLOW_API_KEY || process.env.PREDICTARENA_API_KEY;
}

//#endregion
//#region src/api/client.ts
var ApiError = class extends Error {
	status;
	url;
	body;
	constructor(message, status, url, body) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.url = url;
		this.body = body;
	}
};
var NetworkError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "NetworkError";
	}
};
const DEFAULT_TIMEOUT_MS = 15e3;
const DEFAULT_RETRIES = 2;
function buildUrl(baseUrl, path, query) {
	const url = new URL(path, baseUrl);
	if (query) for (const [key, value] of Object.entries(query)) {
		if (value === void 0 || value === null) continue;
		url.searchParams.set(key, String(value));
	}
	return url.toString();
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
async function requestJson(baseUrl, path, options = {}) {
	const url = buildUrl(baseUrl, path, options.query);
	const method = options.method ?? "GET";
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const retries = options.retries ?? DEFAULT_RETRIES;
	const apiKey = getApiKey();
	const headers = { ...options.headers ?? {} };
	if (apiKey) headers["x-api-key"] = apiKey;
	if (method !== "GET") headers["content-type"] = "application/json";
	for (let attempt = 0; attempt <= retries; attempt += 1) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const res = await fetch(url, {
				method,
				headers,
				body: method === "GET" ? void 0 : JSON.stringify(options.body ?? {}),
				signal: controller.signal
			});
			const text = await res.text();
			const body = text.length ? safeJsonParse(text) : null;
			if (res.ok) return body;
			if ((res.status === 429 || res.status === 503) && attempt < retries) {
				await sleep(500 * Math.pow(2, attempt));
				continue;
			}
			throw new ApiError(`Request failed (${res.status})`, res.status, url, body);
		} catch (err) {
			if (err instanceof ApiError) throw err;
			if (err instanceof Error && err.name === "AbortError") {
				if (attempt < retries) continue;
				throw new NetworkError(`Request timed out after ${timeoutMs}ms`);
			}
			if (attempt < retries) continue;
			throw new NetworkError(err instanceof Error ? err.message : "Network error");
		} finally {
			clearTimeout(timer);
		}
	}
	throw new NetworkError("Request failed after retries");
}
function safeJsonParse(text) {
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

//#endregion
//#region src/api/metadata.ts
const base = () => getMetadataApiBase();
async function getEvents(opts) {
	return requestJson(base(), "/api/v1/events", { query: {
		limit: opts.limit,
		cursor: opts.cursor,
		seriesTickers: opts.seriesTickers,
		status: opts.status,
		isInitialized: opts.isInitialized,
		sort: opts.sort,
		order: opts.order,
		withNestedMarkets: opts.withNestedMarkets
	} });
}
async function getEvent(eventId, opts) {
	return requestJson(base(), `/api/v1/event/${eventId}`, { query: { withNestedMarkets: opts?.withNestedMarkets } });
}
async function getMarkets(opts) {
	return requestJson(base(), "/api/v1/markets", { query: {
		limit: opts.limit,
		cursor: opts.cursor,
		status: opts.status,
		isInitialized: opts.isInitialized,
		sort: opts.sort,
		order: opts.order
	} });
}
async function getMarket(marketId) {
	return requestJson(base(), `/api/v1/market/${marketId}`);
}
async function getMarketByMint(mintAddress) {
	return requestJson(base(), `/api/v1/market/by-mint/${mintAddress}`);
}
async function getOrderbookByTicker(marketTicker) {
	return requestJson(base(), `/api/v1/orderbook/${marketTicker}`);
}
async function getOrderbookByMint(mintAddress) {
	return requestJson(base(), `/api/v1/orderbook/by-mint/${mintAddress}`);
}
async function getSeries(opts) {
	return requestJson(base(), "/api/v1/series", { query: {
		category: opts.category,
		tags: opts.tags,
		isInitialized: opts.isInitialized,
		status: opts.status
	} });
}
async function getSeriesByTicker(seriesTicker) {
	return requestJson(base(), `/api/v1/series/${seriesTicker}`);
}
async function getTagsByCategories() {
	return requestJson(base(), "/api/v1/tags_by_categories");
}
async function searchEvents(opts) {
	return requestJson(base(), "/api/v1/search", { query: {
		q: opts.q,
		sort: opts.sort,
		order: opts.order,
		limit: opts.limit,
		cursor: opts.cursor,
		withNestedMarkets: opts.withNestedMarkets,
		withMarketAccounts: opts.withMarketAccounts
	} });
}
async function getTrades(opts) {
	return requestJson(base(), "/api/v1/trades", { query: {
		limit: opts.limit,
		cursor: opts.cursor,
		ticker: opts.ticker,
		minTs: opts.minTs,
		maxTs: opts.maxTs
	} });
}
async function getTradesByMint(mintAddress) {
	return requestJson(base(), `/api/v1/trades/by-mint/${mintAddress}`);
}
async function filterOutcomeMints(addresses) {
	const body = { addresses };
	return requestJson(base(), "/api/v1/filter_outcome_mints", {
		method: "POST",
		body
	});
}

//#endregion
export { getMarketByMint as a, getOrderbookByTicker as c, getTagsByCategories as d, getTrades as f, getTradeApiBase as g, requestJson as h, getMarket as i, getSeries as l, searchEvents as m, getEvent as n, getMarkets as o, getTradesByMint as p, getEvents as r, getOrderbookByMint as s, filterOutcomeMints as t, getSeriesByTicker as u };
//# sourceMappingURL=metadata-W-pHA1-K.mjs.map