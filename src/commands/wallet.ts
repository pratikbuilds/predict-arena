import fs from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { loadKeypairFromPath, WalletLoadError } from "../utils/wallet";
import { getSolanaRpcUrl } from "../utils/config";
import { applyGlobalOptions, getGlobalOptions } from "../utils/cli";
import { createLogger } from "../utils/logger";
import { printOutput } from "../utils/output";

export function registerWalletCommand(program: Command): void {
  const wallet = program
    .command("wallet")
    .description("Create or manage Solana keypair for agent signing");

  const create = wallet
    .command("create <path>")
    .description("Generate keypair, save to file, print public key for funding")
    .action(async (pathArg: string, _options, command) => {
      const globals = getGlobalOptions(command);
      const logger = createLogger({ verbose: globals.verbose });

      const resolved = path.resolve(process.cwd(), pathArg);

      if (fs.existsSync(resolved)) {
        const stat = fs.statSync(resolved);
        if (stat.isDirectory()) {
          logger.error("Path must be a file, not a directory.");
          process.exit(1);
        }
      }

      const dir = path.dirname(resolved);
      if (dir !== ".") {
        fs.mkdirSync(dir, { recursive: true });
      }

      logger.debug(`Generating keypair and writing to ${resolved}`);
      const keypair = Keypair.generate();
      fs.writeFileSync(
        resolved,
        JSON.stringify(Array.from(keypair.secretKey)),
        "utf8",
      );

      const publicKey = keypair.publicKey.toBase58();

      if (globals.json) {
        printOutput("json", {
          data: { publicKey, path: resolved },
        });
        return;
      }

      console.log(`Wallet saved to ${resolved}`);
      console.log(`Public key: ${publicKey}`);
      console.log("Fund this address to use it.");
    });

  const balance = wallet
    .command("balance")
    .description(
      "Show SOL and token balances. Use --wallet (keypair path) or --pubkey (read-only address).",
    )
    .option("--wallet <path>", "Path to wallet keypair JSON file")
    .option("--pubkey <address>", "Solana public key (read-only)")
    .option("--rpc <url>", "Solana RPC URL (or set SOLANA_RPC_URL)")
    .action(async (options, command) => {
      const globals = getGlobalOptions(command);
      const logger = createLogger({ verbose: globals.verbose });

      let address: string;
      if (options.pubkey) {
        try {
          address = new PublicKey(options.pubkey).toBase58();
        } catch {
          logger.error("Invalid --pubkey: must be a valid Solana base58 address.");
          process.exit(1);
        }
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
          address = keypair.publicKey.toBase58();
        } catch (err) {
          if (err instanceof WalletLoadError) {
            logger.error(err.message);
            process.exit(1);
          }
          throw err;
        }
      }

      const rpcUrl = options.rpc || getSolanaRpcUrl();
      if (!rpcUrl) {
        logger.error("RPC URL required: use --rpc <url> or set SOLANA_RPC_URL.");
        process.exit(1);
      }

      const connection = new Connection(rpcUrl);
      const owner = new PublicKey(address);

      const [solBalance, tokenAccountsLegacy, tokenAccounts2022] =
        await Promise.all([
          connection.getBalance(owner),
          connection.getParsedTokenAccountsByOwner(owner, {
            programId: TOKEN_PROGRAM_ID,
          }),
          connection.getParsedTokenAccountsByOwner(owner, {
            programId: TOKEN_2022_PROGRAM_ID,
          }),
        ]);

      const tokens: { mint: string; rawAmount: string; decimals: number; uiAmount: number | null }[] = [];
      for (const { account } of [...tokenAccountsLegacy.value, ...tokenAccounts2022.value]) {
        const info = account.data.parsed?.info;
        if (!info?.mint || !info?.tokenAmount) continue;
        const amt = info.tokenAmount;
        const raw = amt.amount ?? "0";
        if (Number(raw) <= 0) continue;
        tokens.push({
          mint: info.mint,
          rawAmount: raw,
          decimals: amt.decimals ?? 6,
          uiAmount: amt.uiAmount ?? null,
        });
      }

      const data = {
        address,
        sol: {
          lamports: solBalance,
          sol: solBalance / 1e9,
        },
        tokens,
      };

      if (globals.json) {
        printOutput("json", { data });
        return;
      }

      console.log(`Address: ${address}`);
      console.log(`SOL: ${data.sol.sol} (${data.sol.lamports} lamports)`);
      if (tokens.length > 0) {
        console.log("Tokens:");
        for (const t of tokens) {
          const ui = t.uiAmount != null ? t.uiAmount.toFixed(6) : t.rawAmount;
          console.log(`  ${t.mint}: ${ui}`);
        }
      }
    });

  applyGlobalOptions(create);
  applyGlobalOptions(balance);
}
