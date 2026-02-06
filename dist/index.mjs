import { a as getMarketByMint, c as getOrderbookByTicker, d as getTagsByCategories, f as getTrades, g as getTradeApiBase, h as requestJson, i as getMarket, l as getSeries, m as searchEvents, n as getEvent, o as getMarkets, p as getTradesByMint, r as getEvents, s as getOrderbookByMint, t as filterOutcomeMints, u as getSeriesByTicker } from "./metadata-W-pHA1-K.mjs";

//#region src/api/trade.ts
const base = () => getTradeApiBase();
async function getOrder(params) {
	return requestJson(base(), "/order", { query: {
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
		includeJitoSandwichMitigationAccount: params.includeJitoSandwichMitigationAccount,
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
		restrictRevertMint: params.restrictRevertMint
	} });
}
async function getOrderStatus(orderId) {
	return requestJson(base(), "/order-status", { query: { orderId } });
}

//#endregion
export { filterOutcomeMints, getEvent, getEvents, getMarket, getMarketByMint, getMarkets, getOrder, getOrderStatus, getOrderbookByMint, getOrderbookByTicker, getSeries, getSeriesByTicker, getTagsByCategories, getTrades, getTradesByMint, searchEvents };
//# sourceMappingURL=index.mjs.map