import { requestJson } from "./client";
import { getTradeApiBase } from "../utils/config";
import type { OrderResponse, SlippageTolerance, PlatformFeeMode, OrderPrioritizationFeeLamports, IncludeJitoSandwichMitigationAccount } from "../types/trade";

const base = () => getTradeApiBase();

export async function getOrder(params: {
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
}): Promise<OrderResponse> {
  return requestJson<OrderResponse>(base(), "/order", {
    query: {
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amount,
      userPublicKey: params.userPublicKey,
      slippageBps: params.slippageBps,
      predictionMarketSlippageBps: params.predictionMarketSlippageBps,
      platformFeeBps: params.platformFeeBps,
      platformFeeMode: params.platformFeeMode,
      platformFeeScale: params.platformFeeScale,
      feeAccount: params.feeAccount,
      referralAccount: params.referralAccount,
      positiveSlippageFeeAccount: params.positiveSlippageFeeAccount,
      positiveSlippageLimitPct: params.positiveSlippageLimitPct,
      sponsor: params.sponsor,
      destinationTokenAccount: params.destinationTokenAccount,
      destinationWallet: params.destinationWallet,
      revertWallet: params.revertWallet,
      wrapAndUnwrapSol: params.wrapAndUnwrapSol,
      prioritizationFeeLamports: params.prioritizationFeeLamports,
      computeUnitPriceMicroLamports: params.computeUnitPriceMicroLamports,
      dynamicComputeUnitLimit: params.dynamicComputeUnitLimit,
      includeJitoSandwichMitigationAccount:
        params.includeJitoSandwichMitigationAccount,
      predictionMarketInitPayer: params.predictionMarketInitPayer,
      outcomeAccountRentRecipient: params.outcomeAccountRentRecipient,
      perLegSlippage: params.perLegSlippage,
      dexes: params.dexes,
      excludeDexes: params.excludeDexes,
      onlyDirectRoutes: params.onlyDirectRoutes,
      maxRouteLength: params.maxRouteLength,
      onlyJitRoutes: params.onlyJitRoutes,
      forJitoBundle: params.forJitoBundle,
      allowSyncExec: params.allowSyncExec,
      allowAsyncExec: params.allowAsyncExec,
      restrictRevertMint: params.restrictRevertMint,
    },
  });
}

export async function getOrderStatus(orderId: string): Promise<unknown> {
  return requestJson<unknown>(base(), "/order-status", {
    query: { orderId },
  });
}
