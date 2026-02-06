const KNOWN_MINTS: Record<string, string> = {
  So11111111111111111111111111111111111111112: "SOL",
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
  CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH: "CASH",
};

/** Decimals for known mints (SOL=9, USDC=6, CASH=6). Used when order.routePlan is missing. */
const KNOWN_MINT_DECIMALS: Record<string, number> = {
  So11111111111111111111111111111111111111112: 9,
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 6,
  CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH: 6,
};

export function getMintLabel(mint: string, fallbackToShort = true): string {
  const label = KNOWN_MINTS[mint];
  if (label) return label;
  if (fallbackToShort && mint.length >= 8) return `${mint.slice(0, 8)}…`;
  return mint;
}

export function getMintDecimals(mint: string): number | undefined {
  return KNOWN_MINT_DECIMALS[mint];
}
