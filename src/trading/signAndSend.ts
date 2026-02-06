import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import type { OrderResponse } from "../types/trade";

export class TransactionParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionParseError";
  }
}

export class QuoteExpiredError extends Error {
  constructor(
    message: string,
    public lastValidBlockHeight: number,
    public currentBlockHeight: number,
  ) {
    super(message);
    this.name = "QuoteExpiredError";
  }
}

/**
 * Deserialize base64-encoded transaction from DFlow order response.
 * Throws TransactionParseError if order has no transaction or invalid base64.
 */
export function parseTransactionFromOrder(order: OrderResponse): VersionedTransaction {
  const raw = order.transaction;
  if (!raw || typeof raw !== "string") {
    throw new TransactionParseError(
      "Order response did not include a transaction; ensure userPublicKey was provided and the order is valid.",
    );
  }
  let buffer: Buffer;
  try {
    buffer = Buffer.from(raw, "base64");
  } catch {
    throw new TransactionParseError("Order transaction is not valid base64.");
  }
  if (buffer.length === 0) {
    throw new TransactionParseError("Order transaction is empty.");
  }
  try {
    return VersionedTransaction.deserialize(buffer);
  } catch (err) {
    throw new TransactionParseError(
      `Failed to deserialize transaction: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export interface SignAndSendOptions {
  skipPreflight?: boolean;
  commitment?: "processed" | "confirmed" | "finalized";
  /** If true, only send the transaction; do not wait for confirmation. */
  skipConfirm?: boolean;
}

/**
 * Sign the transaction with the keypair and submit to the RPC.
 * Confirms using blockheight strategy when lastValidBlockHeight is set.
 * Throws QuoteExpiredError if current block height >= lastValidBlockHeight.
 */
export async function signAndSend(
  connection: Connection,
  order: OrderResponse,
  keypair: Keypair,
  options: SignAndSendOptions = {},
): Promise<string> {
  const lastValid = order.lastValidBlockHeight;
  if (lastValid != null) {
    const current = await connection.getBlockHeight("confirmed");
    if (current >= lastValid) {
      throw new QuoteExpiredError(
        `Quote expired: current block height ${current} >= lastValidBlockHeight ${lastValid}. Request a fresh order.`,
        lastValid,
        current,
      );
    }
  }

  const tx = parseTransactionFromOrder(order);
  tx.sign([keypair]);
  const serialized = Buffer.from(tx.serialize());

  const skipPreflight = options.skipPreflight ?? false;
  const commitment = options.commitment ?? "confirmed";
  const skipConfirm = options.skipConfirm ?? false;

  const signature = await connection.sendRawTransaction(serialized, {
    skipPreflight,
    preflightCommitment: commitment,
  });

  if (skipConfirm) return signature;

  if (lastValid != null) {
    const blockhash = tx.message.recentBlockhash;
    await connection.confirmTransaction(
      { signature, lastValidBlockHeight: lastValid, blockhash },
      commitment,
    );
    return signature;
  }

  await connection.confirmTransaction(signature, commitment);
  return signature;
}
