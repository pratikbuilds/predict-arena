import type { Command } from "commander";
import { Connection } from "@solana/web3.js";
import { getOrder, getOrderStatus } from "../api/trade";
import { getMarketByMint } from "../api/metadata";
import { ApiError } from "../api/client";
import { loadKeypairFromPath, WalletLoadError } from "../utils/wallet";
import { getMintLabel, getMintDecimals } from "../utils/mintLabels";
import { getMintDecimalsOnChainBatch } from "../utils/mintDecimals";
import { getSolanaRpcUrl } from "../utils/config";
import { applyGlobalOptions, getGlobalOptions } from "../utils/cli";
import { createLogger } from "../utils/logger";
import { printOutput } from "../utils/output";
import {
  signAndSend,
  QuoteExpiredError,
  TransactionParseError,
} from "../trading/signAndSend";
import type { OrderResponse, RoutePlanLeg } from "../types/trade";

interface MarketContext {
  marketTicker: string;
  eventTicker: string;
  marketTitle: string;
}

async function resolveMarketContext(
  outputMint: string,
  inputMint: string,
): Promise<MarketContext | null> {
  for (const mint of [outputMint, inputMint]) {
    try {
      const market = await getMarketByMint(mint);
      return {
        marketTicker: market.ticker,
        eventTicker: market.eventTicker,
        marketTitle: market.title,
      };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) continue;
      throw err;
    }
  }
  return null;
}

function getOrderDecimals(
  order: OrderResponse,
  decimalsMap?: Record<string, number>,
): {
  inputMintDecimals: number | undefined;
  outputMintDecimals: number | undefined;
} {
  const legs = order.routePlan;
  if (legs?.length) {
    const first = legs[0] as RoutePlanLeg;
    const last = legs[legs.length - 1] as RoutePlanLeg;
    return {
      inputMintDecimals: first.inputMintDecimals,
      outputMintDecimals: last.outputMintDecimals,
    };
  }
  return {
    inputMintDecimals:
      decimalsMap?.[order.inputMint] ?? getMintDecimals(order.inputMint),
    outputMintDecimals:
      decimalsMap?.[order.outputMint] ?? getMintDecimals(order.outputMint),
  };
}

function buildTradeSummary(
  order: OrderResponse,
  market: MarketContext | null,
): string {
  const inLabel = getMintLabel(order.inputMint);
  const outLabel = getMintLabel(order.outputMint);
  const mode = order.executionMode;
  let line = `Trade: ${order.inAmount} ${inLabel} → ${order.outAmount} ${outLabel} [${mode}]`;
  if (market) {
    line += `\nMarket: ${market.eventTicker} / ${market.marketTicker}`;
  }
  return line;
}

function buildTradeData(
  order: OrderResponse,
  market: MarketContext | null,
  decimalsMap?: Record<string, number>,
): Record<string, unknown> {
  const { inputMintDecimals, outputMintDecimals } = getOrderDecimals(
    order,
    decimalsMap,
  );
  const trade: Record<string, unknown> = {
    inputMint: order.inputMint,
    outputMint: order.outputMint,
    inAmount: order.inAmount,
    outAmount: order.outAmount,
    inputMintDecimals: inputMintDecimals ?? undefined,
    outputMintDecimals: outputMintDecimals ?? undefined,
    executionMode: order.executionMode,
    minOutAmount: order.minOutAmount,
    priceImpactPct: order.priceImpactPct,
    lastValidBlockHeight: order.lastValidBlockHeight ?? undefined,
  };
  if (market) {
    trade.marketTicker = market.marketTicker;
    trade.eventTicker = market.eventTicker;
    trade.marketTitle = market.marketTitle;
  }
  return trade;
}

export function registerTradeCommand(program: Command): void {
  const trade = program
    .command("trade")
    .description("Execute a swap (input mint → output mint) using a wallet keypair")
    .requiredOption("--wallet <path>", "Path to wallet keypair JSON file")
    .requiredOption("--input-mint <mint>", "Input token mint address")
    .requiredOption("--output-mint <mint>", "Output token mint address")
    .requiredOption("--amount <raw>", "Input amount (raw integer, e.g. 1000000 for 1 USDC)", (v) => Number(v))
    .option("--slippage-bps <bps>", "Slippage in basis points (default: 50)", (v) => (v === "auto" ? "auto" : Number(v)), 50)
    .option("--priority <level>", "Priority fee: auto, medium, high, veryHigh, disabled, or lamports number", (v) => (["auto", "medium", "high", "veryHigh", "disabled"].includes(v) ? v : Number(v)), "auto")
    .option("--rpc <url>", "Solana RPC URL (or set SOLANA_RPC_URL / PREDICTARENA_RPC_URL)")
    .option("--dry-run", "Fetch order and print quote only; do not sign or send")
    .option("--no-confirm", "Send transaction but do not wait for confirmation")
    .option("--skip-preflight", "Skip preflight simulation (default: false)")
    .action(async (options, command) => {
      const globals = getGlobalOptions(command);
      const logger = createLogger({ verbose: globals.verbose });
      const format = globals.json ? "json" : "plain";

      const walletPath =
        options.wallet ||
        process.env.PREDICTARENA_WALLET ||
        process.env.WALLET_PATH;
      if (!walletPath) {
        logger.error("Wallet path required: use --wallet <path> or set PREDICTARENA_WALLET.");
        process.exit(1);
      }

      let keypair;
      try {
        keypair = loadKeypairFromPath(walletPath);
      } catch (err) {
        if (err instanceof WalletLoadError) {
          logger.error(err.message);
          process.exit(1);
        }
        throw err;
      }

      const userPublicKey = keypair.publicKey.toBase58();
      const slippageBps = options.slippageBps;
      const prioritizationFeeLamports = options.priority;

      logger.debug("Fetching order...");
      let order: OrderResponse;
      try {
        order = await getOrder({
          inputMint: options.inputMint,
          outputMint: options.outputMint,
          amount: options.amount,
          userPublicKey,
          slippageBps: slippageBps === "auto" ? "auto" : slippageBps,
          prioritizationFeeLamports:
            typeof prioritizationFeeLamports === "string"
              ? prioritizationFeeLamports
              : prioritizationFeeLamports,
        });
      } catch (err) {
        if (err instanceof ApiError) {
          logger.error(`Order failed (${err.status}): ${JSON.stringify(err.body)}`);
          process.exit(1);
        }
        throw err;
      }

      let decimalsMap: Record<string, number> = {};
      const rpcUrlForDecimals = options.rpc || getSolanaRpcUrl();
      if (rpcUrlForDecimals) {
        try {
          const connectionForDecimals = new Connection(rpcUrlForDecimals);
          decimalsMap = await getMintDecimalsOnChainBatch(connectionForDecimals, [
            order.inputMint,
            order.outputMint,
          ]);
        } catch {
          // non-fatal: we still have routePlan or known mints
        }
      }

      let market: MarketContext | null = null;
      try {
        market = await resolveMarketContext(order.outputMint, order.inputMint);
      } catch (err) {
        if (err instanceof ApiError && err.status !== 404) {
          logger.error(`Market lookup failed: ${err.message}`);
          process.exit(1);
        }
      }

      const summary = buildTradeSummary(order, market);
      const tradeData = buildTradeData(order, market, decimalsMap);

      if (options.dryRun) {
        if (format === "json") {
          printOutput("json", {
            data: {
              trade: tradeData,
              dryRun: true,
              quote: {
                minOutAmount: order.minOutAmount,
                priceImpactPct: order.priceImpactPct,
                lastValidBlockHeight: order.lastValidBlockHeight,
              },
              message: "Dry run — no transaction signed or sent.",
            },
          });
        } else {
          console.log(summary);
          console.log(`Min out amount: ${order.minOutAmount}`);
          console.log(`Price impact: ${order.priceImpactPct}%`);
          if (order.lastValidBlockHeight != null) {
            console.log(`Last valid block height: ${order.lastValidBlockHeight}`);
          }
          console.log("Dry run — no transaction signed or sent.");
        }
        return;
      }

      if (!order.transaction) {
        logger.error(
          "Order response did not include a transaction. Check userPublicKey and order parameters.",
        );
        process.exit(1);
      }

      const rpcUrl = options.rpc || getSolanaRpcUrl();
      if (!rpcUrl) {
        logger.error(
          "RPC URL required: use --rpc <url> or set SOLANA_RPC_URL / PREDICTARENA_RPC_URL.",
        );
        process.exit(1);
      }

      const skipConfirm = options.confirm === false;
      if (!skipConfirm && order.lastValidBlockHeight == null) {
        logger.error(
          "Order has no lastValidBlockHeight; use --no-confirm to send without confirmation.",
        );
        process.exit(1);
      }

      const connection = new Connection(rpcUrl, "confirmed");

      try {
        const signature = await signAndSend(connection, order, keypair, {
          skipPreflight: options.skipPreflight ?? false,
          commitment: "confirmed",
          skipConfirm,
        });

        let orderStatus: unknown;
        try {
          orderStatus = await getOrderStatus(
            signature,
            order.lastValidBlockHeight ?? undefined,
          );
        } catch {
          orderStatus = undefined;
        }

        if (format === "json") {
          printOutput("json", {
            data: {
              trade: tradeData,
              result: {
                signature,
                confirmed: !skipConfirm,
                orderStatus: orderStatus ?? undefined,
              },
            },
          });
        } else {
          console.log(summary);
          console.log(`Signature: ${signature}`);
          console.log(skipConfirm ? "Sent (not confirmed)." : "Confirmed.");
        }
      } catch (err) {
        if (err instanceof QuoteExpiredError) {
          logger.error(err.message);
          process.exit(1);
        }
        if (err instanceof TransactionParseError) {
          logger.error(err.message);
          process.exit(1);
        }
        throw err;
      }
    });

  applyGlobalOptions(trade);
}
