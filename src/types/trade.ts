export type ExecutionMode = "sync" | "async";

export type PlatformFeeMode = "outputMint" | "inputMint";

export type SlippageTolerance = number | "auto";

export type OrderPrioritizationFeeLamports =
  | "auto"
  | "medium"
  | "high"
  | "veryHigh"
  | "disabled"
  | number;

export type IncludeJitoSandwichMitigationAccount = boolean | string;

export interface PlatformFee {
  amount: string;
  feeBps: number;
  segmenterFeeAmount: string;
  segmenterFeePct: number;
  feeAccount: string;
}

export interface DynamicRoutePlanLeg {
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

export interface SingleMarketRoutePlanLeg {
  venue: string;
  marketKey: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  inputMintDecimals: number;
  outputMintDecimals: number;
}

export type RoutePlanLeg = DynamicRoutePlanLeg | SingleMarketRoutePlanLeg;

export interface PrioritizationType {
  computeBudget: {
    microLamports: number;
    estimatedMicroLamports?: number | null;
  };
}

export interface OrderResponse {
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

export type OrderStatus =
  | "pending"
  | "expired"
  | "failed"
  | "open"
  | "pendingClose"
  | "closed";

export interface Fill {
  signature: string;
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
}

export interface Revert {
  signature: string;
  mint: string;
  amount: string;
}

export interface OrderStatusResponse {
  status: OrderStatus;
  inAmount: string;
  outAmount: string;
  fills?: Fill[];
  reverts?: Revert[];
}
