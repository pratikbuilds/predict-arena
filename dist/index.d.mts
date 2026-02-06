//#region src/types/domain.d.ts
type SortField = "volume" | "volume24h" | "liquidity" | "openInterest" | "startDate";
type SortMethod = "asc" | "desc";
type MarketStatus = "initialized" | "active" | "inactive" | "closed" | "determined" | "finalized";
interface SettlementSource {
  name: string;
  url: string;
}
interface MarketAccountInfo {
  marketLedger: string;
  yesMint: string;
  noMint: string;
  isInitialized: boolean;
  redemptionStatus?: string | null;
  scalarOutcomePct?: number | null;
}
interface SingleMarketResponse {
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
interface SingleEventResponse {
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
interface SingleTradeResponse {
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
interface SeriesResponse {
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
interface Orderbook {
  yes_bids?: Record<string, number>;
  no_bids?: Record<string, number>;
  sequence?: number;
  [k: string]: unknown;
}
//#endregion
//#region src/types/api.d.ts
interface ErrorResponse {
  code: string;
  msg: string;
}
interface EventsResponse {
  events: SingleEventResponse[];
  cursor: number | null;
}
interface EventResponse extends SingleEventResponse {}
interface MarketsResponse {
  markets: SingleMarketResponse[];
  cursor: number | null;
}
interface MarketResponse extends SingleMarketResponse {}
interface SeriesListResponse {
  series: SeriesResponse[];
}
interface SeriesResponseSingle extends SeriesResponse {}
interface TagsByCategoriesResponse {
  tagsByCategories: Record<string, string[] | null>;
}
interface SearchResponse {
  events: SingleEventResponse[];
  cursor: number;
}
interface TradesResponse {
  trades: SingleTradeResponse[];
  cursor: string | null;
}
interface FilterOutcomeMintsRequest {
  addresses: string[];
}
interface FilterOutcomeMintsResponse {
  outcomeMints: string[];
}
//#endregion
//#region src/api/metadata.d.ts
declare function getEvents(opts: {
  limit?: number;
  cursor?: number;
  seriesTickers?: string;
  status?: string;
  isInitialized?: boolean;
  sort?: SortField;
  order?: SortMethod;
  withNestedMarkets?: boolean;
}): Promise<EventsResponse>;
declare function getEvent(eventId: string, opts?: {
  withNestedMarkets?: boolean;
}): Promise<EventResponse>;
declare function getMarkets(opts: {
  limit?: number;
  cursor?: number;
  status?: string;
  isInitialized?: boolean;
  sort?: SortField;
  order?: SortMethod;
}): Promise<MarketsResponse>;
declare function getMarket(marketId: string): Promise<MarketResponse>;
declare function getMarketByMint(mintAddress: string): Promise<MarketResponse>;
declare function getOrderbookByTicker(marketTicker: string): Promise<Orderbook>;
declare function getOrderbookByMint(mintAddress: string): Promise<Orderbook>;
declare function getSeries(opts: {
  category?: string;
  tags?: string;
  isInitialized?: boolean;
  status?: string;
}): Promise<SeriesListResponse>;
declare function getSeriesByTicker(seriesTicker: string): Promise<SeriesResponseSingle>;
declare function getTagsByCategories(): Promise<TagsByCategoriesResponse>;
declare function searchEvents(opts: {
  q: string;
  sort?: SortField;
  order?: SortMethod;
  limit?: number;
  cursor?: number;
  withNestedMarkets?: boolean;
  withMarketAccounts?: boolean;
}): Promise<SearchResponse>;
declare function getTrades(opts: {
  limit?: number;
  cursor?: string;
  ticker?: string;
  minTs?: number;
  maxTs?: number;
}): Promise<TradesResponse>;
declare function getTradesByMint(mintAddress: string): Promise<TradesResponse>;
declare function filterOutcomeMints(addresses: string[]): Promise<FilterOutcomeMintsResponse>;
//#endregion
//#region src/types/trade.d.ts
type ExecutionMode = "sync" | "async";
type PlatformFeeMode = "outputMint" | "inputMint";
type SlippageTolerance = number | "auto";
type OrderPrioritizationFeeLamports = "auto" | "medium" | "high" | "veryHigh" | "disabled" | number;
type IncludeJitoSandwichMitigationAccount = boolean | string;
interface PlatformFee {
  amount: string;
  feeBps: number;
  segmenterFeeAmount: string;
  segmenterFeePct: number;
  feeAccount: string;
}
interface DynamicRoutePlanLeg {
  venue: string;
  marketKey: string;
  data: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  inputMintDecimals: number;
  outputMintDecimals: number;
}
interface SingleMarketRoutePlanLeg {
  venue: string;
  marketKey: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  inputMintDecimals: number;
  outputMintDecimals: number;
}
type RoutePlanLeg = DynamicRoutePlanLeg | SingleMarketRoutePlanLeg;
interface PrioritizationType {
  computeBudget: {
    microLamports: number;
    estimatedMicroLamports?: number | null;
  };
}
interface OrderResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  minOutAmount: string;
  slippageBps: number;
  priceImpactPct: string;
  contextSlot: number;
  executionMode: ExecutionMode;
  computeUnitLimit?: number;
  initPredictionMarketCost?: number;
  lastValidBlockHeight?: number;
  platformFee?: PlatformFee | null;
  predictionMarketInitPayerMustSign?: boolean;
  predictionMarketSlippageBps?: number;
  prioritizationFeeLamports?: number;
  prioritizationType?: PrioritizationType;
  revertMint?: string;
  routePlan?: RoutePlanLeg[];
  transaction?: string;
}
//#endregion
//#region src/api/trade.d.ts
declare function getOrder(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  userPublicKey?: string;
  slippageBps?: SlippageTolerance;
  predictionMarketSlippageBps?: SlippageTolerance;
  platformFeeBps?: number;
  platformFeeMode?: PlatformFeeMode;
  platformFeeScale?: number;
  feeAccount?: string;
  referralAccount?: string;
  positiveSlippageFeeAccount?: string;
  positiveSlippageLimitPct?: number;
  sponsor?: string;
  destinationTokenAccount?: string;
  destinationWallet?: string;
  revertWallet?: string;
  wrapAndUnwrapSol?: boolean;
  prioritizationFeeLamports?: OrderPrioritizationFeeLamports;
  computeUnitPriceMicroLamports?: number;
  dynamicComputeUnitLimit?: boolean;
  includeJitoSandwichMitigationAccount?: IncludeJitoSandwichMitigationAccount;
  predictionMarketInitPayer?: string;
  outcomeAccountRentRecipient?: string;
  perLegSlippage?: boolean;
  dexes?: string;
  excludeDexes?: string;
  onlyDirectRoutes?: boolean;
  maxRouteLength?: number;
  onlyJitRoutes?: boolean;
  forJitoBundle?: boolean;
  allowSyncExec?: boolean;
  allowAsyncExec?: boolean;
  restrictRevertMint?: boolean;
}): Promise<OrderResponse>;
declare function getOrderStatus(orderId: string): Promise<unknown>;
//#endregion
export { DynamicRoutePlanLeg, ErrorResponse, EventResponse, EventsResponse, ExecutionMode, FilterOutcomeMintsRequest, FilterOutcomeMintsResponse, IncludeJitoSandwichMitigationAccount, MarketAccountInfo, MarketResponse, MarketStatus, MarketsResponse, OrderPrioritizationFeeLamports, OrderResponse, Orderbook, PlatformFee, PlatformFeeMode, PrioritizationType, RoutePlanLeg, SearchResponse, SeriesListResponse, SeriesResponse, SeriesResponseSingle, SettlementSource, SingleEventResponse, SingleMarketResponse, SingleMarketRoutePlanLeg, SingleTradeResponse, SlippageTolerance, SortField, SortMethod, TagsByCategoriesResponse, TradesResponse, filterOutcomeMints, getEvent, getEvents, getMarket, getMarketByMint, getMarkets, getOrder, getOrderStatus, getOrderbookByMint, getOrderbookByTicker, getSeries, getSeriesByTicker, getTagsByCategories, getTrades, getTradesByMint, searchEvents };
//# sourceMappingURL=index.d.mts.map