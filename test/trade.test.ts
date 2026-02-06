import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import {
  parseTransactionFromOrder,
  TransactionParseError,
} from "../src/trading/signAndSend";
import { loadKeypairFromPath, WalletLoadError } from "../src/utils/wallet";
import type { OrderResponse } from "../src/types/trade";

describe("parseTransactionFromOrder", () => {
  it("throws TransactionParseError when order has no transaction", () => {
    const order = {
      inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      inAmount: "1000000",
      outputMint: "So11111111111111111111111111111111111111112",
      outAmount: "10000",
      otherAmountThreshold: "9900",
      minOutAmount: "9900",
      slippageBps: 50,
      priceImpactPct: "0.01",
      contextSlot: 300000,
      executionMode: "sync" as const,
    } as OrderResponse;

    expect(() => parseTransactionFromOrder(order)).toThrow(TransactionParseError);
    expect(() => parseTransactionFromOrder(order)).toThrow(
      /did not include a transaction/,
    );
  });

  it("throws TransactionParseError when transaction is not valid base64", () => {
    const order = {
      ...({
        inputMint: "x",
        inAmount: "1",
        outputMint: "y",
        outAmount: "1",
        otherAmountThreshold: "1",
        minOutAmount: "1",
        slippageBps: 0,
        priceImpactPct: "0",
        contextSlot: 0,
        executionMode: "sync" as const,
      } as OrderResponse),
      transaction: "!!!", // invalid base64 (cannot decode)
    };

    expect(() => parseTransactionFromOrder(order)).toThrow(TransactionParseError);
  });

  it("throws TransactionParseError when transaction is empty string", () => {
    const order = {
      ...({
        inputMint: "x",
        inAmount: "1",
        outputMint: "y",
        outAmount: "1",
        otherAmountThreshold: "1",
        minOutAmount: "1",
        slippageBps: 0,
        priceImpactPct: "0",
        contextSlot: 0,
        executionMode: "sync" as const,
      } as OrderResponse),
      transaction: "",
    };

    expect(() => parseTransactionFromOrder(order)).toThrow(TransactionParseError);
  });

  it("deserializes valid base64 transaction and returns signable VersionedTransaction", () => {
    const keypair = Keypair.generate();
    const tx = new Transaction();
    tx.recentBlockhash = "11111111111111111111111111111111";
    tx.feePayer = keypair.publicKey;
    const message = tx.compileMessage();
    const versioned = new VersionedTransaction(message);
    const serialized = versioned.serialize();
    const base64 = Buffer.from(serialized).toString("base64");

    const order = {
      ...({
        inputMint: "x",
        inAmount: "1",
        outputMint: "y",
        outAmount: "1",
        otherAmountThreshold: "1",
        minOutAmount: "1",
        slippageBps: 0,
        priceImpactPct: "0",
        contextSlot: 0,
        executionMode: "sync" as const,
      } as OrderResponse),
      transaction: base64,
    };

    const parsed = parseTransactionFromOrder(order);
    expect(parsed).toBeInstanceOf(VersionedTransaction);
    expect(parsed.signatures).toBeDefined();
    expect(parsed.signatures.length).toBe(1);

    parsed.sign([keypair]);
    const sig = parsed.signatures[0];
    expect(sig).toBeDefined();
    expect(sig).toBeInstanceOf(Uint8Array);
    expect(sig.length).toBe(64);
    expect(Array.from(sig).some((b) => b !== 0)).toBe(true);
  });
});

describe("loadKeypairFromPath", () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "predictarena-wallet-test-"));
  });

  it("throws WalletLoadError when file does not exist", () => {
    expect(() => loadKeypairFromPath(path.join(tmpDir, "nonexistent.json"))).toThrow(
      WalletLoadError,
    );
    expect(() => loadKeypairFromPath(path.join(tmpDir, "nonexistent.json"))).toThrow(
      /not found/,
    );
  });

  it("throws WalletLoadError when path is a directory", () => {
    expect(() => loadKeypairFromPath(tmpDir)).toThrow(WalletLoadError);
    expect(() => loadKeypairFromPath(tmpDir)).toThrow(/directory/);
  });

  it("throws WalletLoadError when file is not valid JSON", () => {
    const badPath = path.join(tmpDir, "bad.json");
    fs.writeFileSync(badPath, "not json at all", "utf8");
    expect(() => loadKeypairFromPath(badPath)).toThrow(WalletLoadError);
    expect(() => loadKeypairFromPath(badPath)).toThrow(/Invalid JSON/);
  });

  it("throws WalletLoadError when JSON is not array of 64 numbers", () => {
    const badPath = path.join(tmpDir, "bad-len.json");
    fs.writeFileSync(badPath, JSON.stringify([1, 2, 3]), "utf8");
    expect(() => loadKeypairFromPath(badPath)).toThrow(WalletLoadError);
    expect(() => loadKeypairFromPath(badPath)).toThrow(/64 numbers/);
  });

  it("loads keypair from valid wallet file", () => {
    const keypair = Keypair.generate();
    const walletPath = path.join(tmpDir, "wallet.json");
    fs.writeFileSync(
      walletPath,
      JSON.stringify(Array.from(keypair.secretKey)),
      "utf8",
    );
    const loaded = loadKeypairFromPath(walletPath);
    expect(loaded.publicKey.toBase58()).toBe(keypair.publicKey.toBase58());
  });
});

const exec = promisify(execFile);
const cli = "dist/bin.mjs";

describe("trade command dry-run output", () => {
  let walletPath: string;

  beforeAll(() => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "predictarena-trade-"));
    const keypair = Keypair.generate();
    walletPath = path.join(tmpDir, "wallet.json");
    fs.writeFileSync(
      walletPath,
      JSON.stringify(Array.from(keypair.secretKey)),
      "utf8",
    );
  });

  it("dry-run --json returns trade summary, quote, and dry-run message", async () => {
    const { stdout } = await exec(
      "node",
      [
        cli,
        "trade",
        "--wallet",
        walletPath,
        "--input-mint",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "--output-mint",
        "So11111111111111111111111111111111111111112",
        "--amount",
        "1000000",
        "--dry-run",
        "--json",
      ],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );
    const result = JSON.parse(stdout);
    expect(result.data).toBeDefined();
    expect(result.data.dryRun).toBe(true);
    expect(result.data.message).toBe("Dry run — no transaction signed or sent.");
    expect(result.data.trade).toBeDefined();
    expect(result.data.trade.inputMint).toBe(
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    );
    expect(result.data.trade.outputMint).toBe(
      "So11111111111111111111111111111111111111112",
    );
    expect(result.data.trade.inAmount).toBeDefined();
    expect(result.data.trade.outAmount).toBeDefined();
    expect(result.data.trade.executionMode).toBeDefined();
    expect(result.data.quote).toBeDefined();
    expect(result.data.quote.minOutAmount).toBeDefined();
    expect(result.data.quote.priceImpactPct).toBeDefined();
  }, 25_000);
});
