export const DEFAULT_METADATA_API_BASE =
  "https://dev-prediction-markets-api.dflow.net";
export const DEFAULT_TRADE_API_BASE = "https://dev-quote-api.dflow.net";

export function getMetadataApiBase(): string {
  return (
    process.env.METADATA_API_BASE ||
    process.env.DFLOW_METADATA_API_URL ||
    DEFAULT_METADATA_API_BASE
  );
}

export function getTradeApiBase(): string {
  return (
    process.env.TRADE_API_BASE ||
    process.env.DFLOW_TRADE_API_URL ||
    DEFAULT_TRADE_API_BASE
  );
}

export function getApiKey(): string | undefined {
  return process.env.DFLOW_API_KEY || process.env.PREDICTARENA_API_KEY;
}

export function getSolanaRpcUrl(): string | undefined {
  return (
    process.env.SOLANA_RPC_URL ||
    process.env.PREDICTARENA_RPC_URL ||
    process.env.DFLOW_RPC_URL
  );
}
