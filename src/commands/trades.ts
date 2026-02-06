import type { Command } from "commander";
import { getTrades } from "../api/metadata";
import { applyGlobalOptions, getGlobalOptions } from "../utils/cli";
import { buildHints, tradesDescribeSchema } from "../utils/hints";
import { createLogger } from "../utils/logger";
import { printOutput } from "../utils/output";

export function registerTradesCommand(program: Command): void {
  const trades = program.command("trades").description("Trade history");

  const list = trades
    .command("list")
    .description("List trades with filters")
    .option("--ticker <ticker>", "Filter by market ticker")
    .option("--min-ts <timestamp>", "Min unix timestamp")
    .option("--max-ts <timestamp>", "Max unix timestamp")
    .option("--limit <limit>", "Limit trades (1-1000)")
    .option("--cursor <cursor>", "Pagination cursor (trade ID)")
    .action(async (options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const logger = createLogger({ verbose: globals.verbose });

      logger.debug("Fetching trades...");
      const data = await getTrades({
        ticker: options.ticker,
        minTs: options.minTs ? Number(options.minTs) : undefined,
        maxTs: options.maxTs ? Number(options.maxTs) : undefined,
        limit: options.limit ? Number(options.limit) : undefined,
        cursor: options.cursor,
      });

      const next =
        data.cursor !== null && data.cursor !== undefined
          ? `predictarena trades list --cursor ${data.cursor}`
          : undefined;

      printOutput(format, {
        data,
        pagination: { cursor: data.cursor },
        hints: buildHints({
          available_filters: ["--ticker", "--min-ts", "--max-ts", "--limit", "--cursor"],
          next,
          related: ["predictarena markets list", "predictarena events list"],
        }),
      });
    });

  const describe = trades
    .command("describe")
    .description("Describe trades filters and schema")
    .action((_options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const data = tradesDescribeSchema();
      printOutput(format, { data });
    });

  applyGlobalOptions(trades);
  applyGlobalOptions(list);
  applyGlobalOptions(describe);
}
