import fs from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { Keypair } from "@solana/web3.js";
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

  applyGlobalOptions(create);
}
