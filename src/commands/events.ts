import type { Command } from "commander";
import { getEvent, getEvents } from "../api/metadata";
import { applyGlobalOptions, getGlobalOptions } from "../utils/cli";
import { buildHints, eventsDescribeSchema } from "../utils/hints";
import { createLogger } from "../utils/logger";
import { printOutput } from "../utils/output";

export function registerEventsCommand(program: Command): void {
  const events = program.command("events").description("Discover events");

  const list = events
    .command("list")
    .description("List events with filters")
    .option("--status <status>", "Event status (default: active)")
    .option("--sort <sort>", "Sort field (default: volume)")
    .option("--order <order>", "Sort order (default: desc)")
    .option("--series-tickers <tickers>", "Comma-separated series tickers (max 25)")
    .option("--limit <limit>", "Max results")
    .option("--cursor <cursor>", "Pagination offset")
    .option("--is-initialized", "Only events with market ledger")
    .option("--with-nested-markets", "Include nested markets")
    .action(async (options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const logger = createLogger({ verbose: globals.verbose });

      const status = options.status ?? "active";
      const sort = options.sort ?? "volume";
      const order = options.order ?? "desc";
      const withNestedMarkets =
        options.withNestedMarkets === undefined ? true : options.withNestedMarkets;

      logger.debug("Fetching events...");
      const data = await getEvents({
        status,
        sort,
        order,
        limit: options.limit ? Number(options.limit) : undefined,
        cursor: options.cursor ? Number(options.cursor) : undefined,
        seriesTickers: options.seriesTickers,
        isInitialized: options.isInitialized ?? undefined,
        withNestedMarkets,
      });

      const next =
        data.cursor !== null && data.cursor !== undefined
          ? `predictarena events list --cursor ${data.cursor}`
          : undefined;

      printOutput(format, {
        data,
        pagination: { cursor: data.cursor },
        hints: buildHints({
          available_filters: [
            "--status",
            "--sort",
            "--order",
            "--series-tickers",
            "--limit",
            "--cursor",
            "--is-initialized",
            "--with-nested-markets",
          ],
          next,
          related: ["predictarena categories", "predictarena series"],
        }),
      });
    });

  const get = events
    .command("get <ticker>")
    .description("Get a single event by ticker")
    .option("--with-nested-markets", "Include nested markets")
    .action(async (ticker, options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const logger = createLogger({ verbose: globals.verbose });

      const withNestedMarkets =
        options.withNestedMarkets === undefined ? true : options.withNestedMarkets;

      logger.debug(`Fetching event ${ticker}...`);
      const data = await getEvent(ticker, { withNestedMarkets });

      printOutput(format, {
        data,
        hints: buildHints({
          related: ["predictarena markets list", "predictarena markets get <ticker>"],
        }),
      });
    });

  const describe = events
    .command("describe")
    .description("Describe event filters and schema")
    .action((_options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const data = eventsDescribeSchema();
      printOutput(format, { data });
    });

  applyGlobalOptions(events);
  applyGlobalOptions(list);
  applyGlobalOptions(get);
  applyGlobalOptions(describe);
}
