import type { Command } from "commander";
import { getSeries, getSeriesByTicker } from "../api/metadata";
import { buildHints, seriesDescribeSchema } from "../utils/hints";
import { applyGlobalOptions, getGlobalOptions } from "../utils/cli";
import { createLogger } from "../utils/logger";
import { printOutput } from "../utils/output";

export function registerSeriesCommand(program: Command): void {
  const series = program
    .command("series")
    .description("List series templates")
    .option("--category <category>", "Filter by category")
    .option("--tags <tags>", "Filter by comma-separated tags")
    .option("--status <status>", "Filter by status")
    .option("--is-initialized", "Only series with market ledger")
    .action(async (options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const logger = createLogger({ verbose: globals.verbose });

      logger.debug("Fetching series...");
      const data = await getSeries({
        category: options.category,
        tags: options.tags,
        status: options.status,
        isInitialized: options.isInitialized ?? undefined,
      });

      printOutput(format, {
        data,
        hints: buildHints({
          available_filters: ["--category", "--tags", "--status", "--is-initialized"],
          related: ["predictarena series get <ticker>", "predictarena events list"],
          notes: ["Use series tickers with events list --seriesTickers."],
        }),
      });
    });

  const get = series
    .command("get <ticker>")
    .description("Get a series by ticker")
    .action(async (ticker, _options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const logger = createLogger({ verbose: globals.verbose });

      logger.debug(`Fetching series ${ticker}...`);
      const data = await getSeriesByTicker(ticker);

      printOutput(format, {
        data,
        hints: buildHints({
          related: ["predictarena events list --seriesTickers <ticker>"],
        }),
      });
    });

  const describe = series
    .command("describe")
    .description("Describe series filters and schema")
    .action((_options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const data = seriesDescribeSchema();
      printOutput(format, { data });
    });

  applyGlobalOptions(series);
  applyGlobalOptions(get);
  applyGlobalOptions(describe);
}
