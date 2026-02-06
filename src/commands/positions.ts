import type { Command } from "commander";
import { Connection, PublicKey } from "@solana/web3.js";
import { getPositions, type UserPosition } from "../api/positions";
import { loadKeypairFromPath, WalletLoadError } from "../utils/wallet";
import { getSolanaRpcUrl } from "../utils/config";
import { getGlobalOptions } from "../utils/cli";
import { createLogger } from "../utils/logger";
import { printOutput } from "../utils/output";

function formatPositionLine(p: UserPosition): string {
  const ticker = p.market?.ticker ?? "—";
  const title = p.market?.title ?? p.mint.slice(0, 8) + "…";
  const side = p.position;
  const bal = p.uiAmount != null ? p.uiAmount.toFixed(4) : p.rawBalance;
  return `${ticker}  ${side.padEnd(7)}  ${bal}  ${title}`;
}

function parsePubkey(address: string): string {
  try {
    const key = new PublicKey(address);
    return key.toBase58();
  } catch {
    return "";
  }
}

export function registerPositionsCommand(program: Command): void {
  const positions = program
    .command("positions")
    .description(
      "List prediction market positions (Token-2022 outcome tokens). Use --wallet for your keypair or --pubkey for read-only lookup of any address.",
    )
    .option("--wallet <path>", "Path to wallet keypair JSON file")
    .option("--pubkey <address>", "Solana public key (read-only; no keypair needed)")
    .option("--rpc <url>", "Solana RPC URL (or set SOLANA_RPC_URL / PREDICTARENA_RPC_URL)")
    .action(async (options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const logger = createLogger({ verbose: globals.verbose });

      let walletPublicKey: string;

      if (options.pubkey) {
        walletPublicKey = parsePubkey(options.pubkey);
        if (!walletPublicKey) {
          logger.error("Invalid --pubkey: must be a valid Solana base58 address.");
          process.exit(1);
        }
        logger.debug(`Read-only lookup for pubkey ${walletPublicKey}...`);
      } else {
        const walletPath =
          options.wallet ||
          process.env.PREDICTARENA_WALLET ||
          process.env.WALLET_PATH;
        if (!walletPath) {
          logger.error("Use --wallet <path> or --pubkey <address> (or set PREDICTARENA_WALLET).");
          process.exit(1);
        }
        try {
          const keypair = loadKeypairFromPath(walletPath);
          walletPublicKey = keypair.publicKey.toBase58();
        } catch (err) {
          if (err instanceof WalletLoadError) {
            logger.error(err.message);
            process.exit(1);
          }
          throw err;
        }
        logger.debug(`Fetching positions for ${walletPublicKey}...`);
      }

      const rpcUrl = options.rpc || getSolanaRpcUrl();
      if (!rpcUrl) {
        logger.error("RPC URL required: use --rpc <url> or set SOLANA_RPC_URL.");
        process.exit(1);
      }

      const connection = new Connection(rpcUrl);

      let list: UserPosition[];
      try {
        list = await getPositions(connection, walletPublicKey);
      } catch (err) {
        logger.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }

      if (format === "json") {
        printOutput("json", {
          data: {
            wallet: walletPublicKey,
            positions: list,
          },
        });
        return;
      }

      if (list.length === 0) {
        console.log("No prediction market positions found.");
        return;
      }

      console.log("Ticker   Side     Balance  Market");
      console.log("------   ----     -------  ------");
      for (const p of list) {
        console.log(formatPositionLine(p));
      }
    });
}
