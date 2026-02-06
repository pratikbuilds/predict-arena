import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { filterOutcomeMints, getMarketsBatch } from "./metadata";
import type { SingleMarketResponse } from "../types/domain";

export interface UserPosition {
  mint: string;
  rawBalance: string;
  decimals: number;
  /** Human-readable balance (may be null if too small). */
  uiAmount: number | null;
  position: "YES" | "NO" | "UNKNOWN";
  market: SingleMarketResponse | null;
}

interface TokenBalance {
  mint: string;
  rawBalance: string;
  decimals: number;
  uiAmount: number | null;
}

/**
 * Fetch prediction market positions for a wallet.
 * Uses Solana RPC (Token-2022 accounts) + DFlow Metadata API (filter outcome mints, markets batch).
 */
export async function getPositions(
  connection: Connection,
  walletPublicKey: string | PublicKey,
): Promise<UserPosition[]> {
  const owner = typeof walletPublicKey === "string"
    ? new PublicKey(walletPublicKey)
    : walletPublicKey;

  const parsed = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_2022_PROGRAM_ID,
  });

  const userTokens: TokenBalance[] = parsed.value.map(({ account }) => {
    const info = account.data.parsed?.info;
    if (!info?.mint || !info?.tokenAmount) {
      return null;
    }
    const amount = info.tokenAmount;
    const rawBalance = amount.amount ?? "0";
    const balanceNum = Number(rawBalance);
    if (balanceNum <= 0) return null;
    return {
      mint: info.mint,
      rawBalance,
      decimals: amount.decimals ?? 6,
      uiAmount: amount.uiAmount ?? null,
    };
  }).filter((t): t is TokenBalance => t !== null);

  if (userTokens.length === 0) return [];

  const allMints = userTokens.map((t) => t.mint);
  const { outcomeMints } = await filterOutcomeMints(allMints);
  if (outcomeMints.length === 0) return [];

  const outcomeTokens = userTokens.filter((t) => outcomeMints.includes(t.mint));
  const { markets } = await getMarketsBatch({ mints: outcomeMints });

  const marketsByMint = new Map<string, SingleMarketResponse>();
  for (const market of markets) {
    const accounts = Object.values(market.accounts ?? {});
    for (const acc of accounts) {
      if (acc.yesMint) marketsByMint.set(acc.yesMint, market);
      if (acc.noMint) marketsByMint.set(acc.noMint, market);
    }
  }

  return outcomeTokens.map((token): UserPosition => {
    const market = marketsByMint.get(token.mint) ?? null;
    if (!market) {
      return {
        mint: token.mint,
        rawBalance: token.rawBalance,
        decimals: token.decimals,
        uiAmount: token.uiAmount,
        position: "UNKNOWN",
        market: null,
      };
    }
    const accounts = Object.values(market.accounts ?? {});
    const isYes = accounts.some((a) => a.yesMint === token.mint);
    const isNo = accounts.some((a) => a.noMint === token.mint);
    const position = isYes ? "YES" : isNo ? "NO" : "UNKNOWN";
    return {
      mint: token.mint,
      rawBalance: token.rawBalance,
      decimals: token.decimals,
      uiAmount: token.uiAmount,
      position,
      market,
    };
  });
}
