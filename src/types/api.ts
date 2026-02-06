import type {
  SeriesResponse,
  SingleEventResponse,
  SingleMarketResponse,
  SingleTradeResponse,
} from "./domain";

export interface ErrorResponse {
  code: string;
  msg: string;
}

export interface EventsResponse {
  events: SingleEventResponse[];
  cursor: number | null;
}

export interface EventResponse extends SingleEventResponse {}

export interface MarketsResponse {
  markets: SingleMarketResponse[];
  cursor: number | null;
}

export interface MarketResponse extends SingleMarketResponse {}

export interface SeriesListResponse {
  series: SeriesResponse[];
}

export interface SeriesResponseSingle extends SeriesResponse {}

export interface TagsByCategoriesResponse {
  tagsByCategories: Record<string, string[] | null>;
}

export interface SearchResponse {
  events: SingleEventResponse[];
  cursor: number;
}

export interface TradesResponse {
  trades: SingleTradeResponse[];
  cursor: string | null;
}

export interface FilterOutcomeMintsRequest {
  addresses: string[];
}

export interface FilterOutcomeMintsResponse {
  outcomeMints: string[];
}

export interface MarketsBatchRequest {
  mints?: string[] | null;
  tickers?: string[] | null;
}

export interface MarketsBatchResponse {
  markets: SingleMarketResponse[];
  cursor?: number | null;
}
