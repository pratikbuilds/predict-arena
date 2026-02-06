import type { Command } from "commander";
import { getTagsByCategories } from "../api/metadata";
import { buildHints } from "../utils/hints";
import { applyGlobalOptions, getGlobalOptions } from "../utils/cli";
import { createLogger } from "../utils/logger";
import { printOutput } from "../utils/output";

export function registerCategoriesCommand(program: Command): void {
  const cmd = program
    .command("categories")
    .description("List tags grouped by categories")
    .action(async (_options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const logger = createLogger({ verbose: globals.verbose });

      logger.debug("Fetching tags by categories...");
      const data = await getTagsByCategories();

      printOutput(format, {
        data,
        hints: buildHints({
          related: ["predictarena series --category <category>", "predictarena events list"],
          notes: ["Use categories + tags to discover series tickers."],
        }),
      });
    });

  applyGlobalOptions(cmd);
}
