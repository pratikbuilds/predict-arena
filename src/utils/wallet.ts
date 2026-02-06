import fs from "node:fs";
import path from "node:path";
import { Keypair } from "@solana/web3.js";

export class WalletLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletLoadError";
  }
}

export function loadKeypairFromPath(filePath: string): Keypair {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    throw new WalletLoadError(`Wallet file not found: ${resolved}`);
  }
  const stat = fs.statSync(resolved);
  if (stat.isDirectory()) {
    throw new WalletLoadError(`Path is a directory, expected a file: ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, "utf8");
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    throw new WalletLoadError(`Invalid JSON in wallet file: ${resolved}`);
  }
  if (!Array.isArray(arr) || arr.length !== 64) {
    throw new WalletLoadError(
      `Wallet file must be a JSON array of 64 numbers (secret key): ${resolved}`,
    );
  }
  const secretKey = Uint8Array.from(arr as number[]);
  return Keypair.fromSecretKey(secretKey);
}
