import { requestJson } from "./client";
import { getMetadataApiBase } from "../utils/config";
import type {
  EventsResponse,
  EventResponse,
  MarketsResponse,
  MarketResponse,
  SeriesListResponse,
  SeriesResponseSingle,
  TagsByCategoriesResponse,
  SearchResponse,
  TradesResponse,
  FilterOutcomeMintsRequest,
  FilterOutcomeMintsResponse,
  MarketsBatchRequest,
  MarketsBatchResponse,
} from "../types/api";
import type { Orderbook, SortField, SortMethod } from "../types/domain";

const base = () => getMetadataApiBase();

export async function getEvents(opts: {
  limit?: number;
  cursor?: number;
  seriesTickers?: string;
  status?: string;
  isInitialized?: boolean;
  sort?: SortField;
  order?: SortMethod;
  withNestedMarkets?: boolean;
}): Promise<EventsResponse> {
  return requestJson<EventsResponse>(base(), "/api/v1/events", {
    query: {
      limit: opts.limit,
      cursor: opts.cursor,
      seriesTickers: opts.seriesTickers,
      status: opts.status,
      isInitialized: opts.isInitialized,
      sort: opts.sort,
      order: opts.order,
      withNestedMarkets: opts.withNestedMarkets,
    },
  });
}

export async function getEvent(
  eventId: string,
  opts?: { withNestedMarkets?: boolean },
): Promise<EventResponse> {
  return requestJson<EventResponse>(base(), `/api/v1/event/${eventId}`, {
    query: { withNestedMarkets: opts?.withNestedMarkets },
  });
}

export async function getMarkets(opts: {
  limit?: number;
  cursor?: number;
  status?: string;
  isInitialized?: boolean;
  sort?: SortField;
  order?: SortMethod;
}): Promise<MarketsResponse> {
  return requestJson<MarketsResponse>(base(), "/api/v1/markets", {
    query: {
      limit: opts.limit,
      cursor: opts.cursor,
      status: opts.status,
      isInitialized: opts.isInitialized,
      sort: opts.sort,
      order: opts.order,
    },
  });
}

export async function getMarket(marketId: string): Promise<MarketResponse> {
  return requestJson<MarketResponse>(base(), `/api/v1/market/${marketId}`);
}

export async function getMarketByMint(
  mintAddress: string,
): Promise<MarketResponse> {
  return requestJson<MarketResponse>(
    base(),
    `/api/v1/market/by-mint/${mintAddress}`,
  );
}

export async function getOrderbookByTicker(
  marketTicker: string,
): Promise<Orderbook> {
  return requestJson<Orderbook>(base(), `/api/v1/orderbook/${marketTicker}`);
}

export async function getOrderbookByMint(
  mintAddress: string,
): Promise<Orderbook> {
  return requestJson<Orderbook>(base(), `/api/v1/orderbook/by-mint/${mintAddress}`);
}

export async function getSeries(opts: {
  category?: string;
  tags?: string;
  isInitialized?: boolean;
  status?: string;
}): Promise<SeriesListResponse> {
  return requestJson<SeriesListResponse>(base(), "/api/v1/series", {
    query: {
      category: opts.category,
      tags: opts.tags,
      isInitialized: opts.isInitialized,
      status: opts.status,
    },
  });
}

export async function getSeriesByTicker(
  seriesTicker: string,
): Promise<SeriesResponseSingle> {
  return requestJson<SeriesResponseSingle>(
    base(),
    `/api/v1/series/${seriesTicker}`,
  );
}

export async function getTagsByCategories(): Promise<TagsByCategoriesResponse> {
  return requestJson<TagsByCategoriesResponse>(
    base(),
    "/api/v1/tags_by_categories",
  );
}

export async function searchEvents(opts: {
  q: string;
  sort?: SortField;
  order?: SortMethod;
  limit?: number;
  cursor?: number;
  withNestedMarkets?: boolean;
  withMarketAccounts?: boolean;
}): Promise<SearchResponse> {
  return requestJson<SearchResponse>(base(), "/api/v1/search", {
    query: {
      q: opts.q,
      sort: opts.sort,
      order: opts.order,
      limit: opts.limit,
      cursor: opts.cursor,
      withNestedMarkets: opts.withNestedMarkets,
      withMarketAccounts: opts.withMarketAccounts,
    },
  });
}

export async function getTrades(opts: {
  limit?: number;
  cursor?: string;
  ticker?: string;
  minTs?: number;
  maxTs?: number;
}): Promise<TradesResponse> {
  return requestJson<TradesResponse>(base(), "/api/v1/trades", {
    query: {
      limit: opts.limit,
      cursor: opts.cursor,
      ticker: opts.ticker,
      minTs: opts.minTs,
      maxTs: opts.maxTs,
    },
  });
}

export async function getTradesByMint(
  mintAddress: string,
): Promise<TradesResponse> {
  return requestJson<TradesResponse>(
    base(),
    `/api/v1/trades/by-mint/${mintAddress}`,
  );
}

export async function filterOutcomeMints(
  addresses: string[],
): Promise<FilterOutcomeMintsResponse> {
  const body: FilterOutcomeMintsRequest = { addresses };
  return requestJson<FilterOutcomeMintsResponse>(base(), "/api/v1/filter_outcome_mints", {
    method: "POST",
    body,
  });
}

export async function getMarketsBatch(opts: {
  mints?: string[];
  tickers?: string[];
}): Promise<MarketsBatchResponse> {
  const body: MarketsBatchRequest = {
    mints: opts.mints ?? null,
    tickers: opts.tickers ?? null,
  };
  return requestJson<MarketsBatchResponse>(base(), "/api/v1/markets/batch", {
    method: "POST",
    body,
  });
}
