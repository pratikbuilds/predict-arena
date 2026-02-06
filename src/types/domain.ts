export type SortField =
  | "volume"
  | "volume24h"
  | "liquidity"
  | "openInterest"
  | "startDate";

export type SortMethod = "asc" | "desc";

export type MarketStatus =
  | "initialized"
  | "active"
  | "inactive"
  | "closed"
  | "determined"
  | "finalized";

export interface SettlementSource {
  name: string;
  url: string;
}

export interface MarketAccountInfo {
  marketLedger: string;
  yesMint: string;
  noMint: string;
  isInitialized: boolean;
  redemptionStatus?: string | null;
  scalarOutcomePct?: number | null;
}

export interface SingleMarketResponse {
  ticker: string;
  eventTicker: string;
  marketType: string;
  title: string;
  subtitle: string;
  yesSubTitle: string;
  noSubTitle: string;
  openTime: number;
  closeTime: number;
  expirationTime: number;
  status: string;
  volume: number;
  result: string;
  openInterest: number;
  canCloseEarly: boolean;
  rulesPrimary: string;
  accounts: Record<string, MarketAccountInfo>;
  earlyCloseCondition?: string | null;
  noAsk?: string | null;
  noBid?: string | null;
  rulesSecondary?: string | null;
  yesAsk?: string | null;
  yesBid?: string | null;
}

export interface SingleEventResponse {
  ticker: string;
  seriesTicker: string;
  title: string;
  subtitle: string;
  competition?: string | null;
  competitionScope?: string | null;
  imageUrl?: string | null;
  liquidity?: number | null;
  markets?: SingleMarketResponse[] | null;
  openInterest?: number | null;
  settlementSources?: SettlementSource[] | null;
  strikeDate?: number | null;
  strikePeriod?: string | null;
  volume?: number | null;
  volume24h?: number | null;
}

export interface SingleTradeResponse {
  tradeId: string;
  ticker: string;
  price: number;
  count: number;
  yesPrice: number;
  noPrice: number;
  yesPriceDollars: string;
  noPriceDollars: string;
  takerSide: string;
  createdTime: number;
}

export interface SeriesResponse {
  ticker: string;
  frequency: string;
  title: string;
  category: string;
  tags: string[];
  settlementSources: SettlementSource[];
  contractUrl: string;
  contractTermsUrl: string;
  productMetadata: unknown;
  feeType: string;
  feeMultiplier: number;
  additionalProhibitions: string[];
}

export interface Orderbook {
  yes_bids?: Record<string, number>;
  no_bids?: Record<string, number>;
  sequence?: number;
  [k: string]: unknown;
}
