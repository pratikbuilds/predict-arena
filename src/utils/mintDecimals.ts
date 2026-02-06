import { Connection, PublicKey } from "@solana/web3.js";

/**
 * SPL Token (and Token-2022) mint account layout: decimals is a u8 at offset 41.
 * Layout: mint_authority (COption<Pubkey>) 33 bytes, supply (u64) 8 bytes, decimals (u8) 1 byte.
 */
const MINT_DECIMALS_OFFSET = 41;

/**
 * Fetch decimals for a mint from chain via getAccountInfo. Returns undefined if account missing or not a valid mint.
 */
export async function getMintDecimalsOnChain(
  connection: Connection,
  mintAddress: string,
): Promise<number | undefined> {
  try {
    const accountInfo = await connection.getAccountInfo(
      new PublicKey(mintAddress),
    );
    if (!accountInfo?.data || accountInfo.data.length < MINT_DECIMALS_OFFSET + 1)
      return undefined;
    return accountInfo.data[MINT_DECIMALS_OFFSET];
  } catch {
    return undefined;
  }
}

/**
 * Fetch decimals for multiple mints. Returns a map of mint -> decimals for those that succeeded.
 */
export async function getMintDecimalsOnChainBatch(
  connection: Connection,
  mintAddresses: string[],
): Promise<Record<string, number>> {
  const unique = [...new Set(mintAddresses)];
  const results = await Promise.all(
    unique.map(async (mint) => {
      const decimals = await getMintDecimalsOnChain(connection, mint);
      return { mint, decimals };
    }),
  );
  const map: Record<string, number> = {};
  for (const { mint, decimals } of results) {
    if (decimals !== undefined) map[mint] = decimals;
  }
  return map;
}
