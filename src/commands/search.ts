import type { Command } from "commander";
import { searchEvents } from "../api/metadata";
import { applyGlobalOptions, getGlobalOptions } from "../utils/cli";
import { buildHints } from "../utils/hints";
import { createLogger } from "../utils/logger";
import { printOutput } from "../utils/output";

export function registerSearchCommand(program: Command): void {
  const search = program
    .command("search <query>")
    .description("Search events by title or ticker")
    .option("--sort <sort>", "Sort field")
    .option("--order <order>", "Sort order")
    .option("--limit <limit>", "Limit results")
    .option("--cursor <cursor>", "Pagination offset")
    .option("--with-nested-markets", "Include nested markets")
    .option("--with-market-accounts", "Include market account info")
    .action(async (query, options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const logger = createLogger({ verbose: globals.verbose });

      const withNestedMarkets =
        options.withNestedMarkets === undefined ? true : options.withNestedMarkets;

      logger.debug(`Searching events for: ${query}`);
      const data = await searchEvents({
        q: query,
        sort: options.sort,
        order: options.order,
        limit: options.limit ? Number(options.limit) : undefined,
        cursor: options.cursor ? Number(options.cursor) : undefined,
        withNestedMarkets,
        withMarketAccounts: options.withMarketAccounts ?? undefined,
      });

      const next =
        data.cursor !== null && data.cursor !== undefined
          ? `predictarena search "${query}" --cursor ${data.cursor}`
          : undefined;

      printOutput(format, {
        data,
        pagination: { cursor: data.cursor },
        hints: buildHints({
          available_filters: [
            "--sort",
            "--order",
            "--limit",
            "--cursor",
            "--with-nested-markets",
            "--with-market-accounts",
          ],
          next,
          related: ["predictarena events list", "predictarena markets list"],
        }),
      });
    });

  applyGlobalOptions(search);
}
