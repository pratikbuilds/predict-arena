import type { Command } from "commander";
import {
  getMarket,
  getMarketByMint,
  getMarkets,
  getOrderbookByTicker,
} from "../api/metadata";
import { applyGlobalOptions, getGlobalOptions } from "../utils/cli";
import { buildHints, marketsDescribeSchema } from "../utils/hints";
import { createLogger } from "../utils/logger";
import { printOutput } from "../utils/output";

export function registerMarketsCommand(program: Command): void {
  const markets = program.command("markets").description("Discover markets");

  const list = markets
    .command("list")
    .description("List markets with filters")
    .option("--status <status>", "Market status (default: active)")
    .option("--sort <sort>", "Sort field (default: volume)")
    .option("--order <order>", "Sort order (default: desc)")
    .option("--limit <limit>", "Max results")
    .option("--cursor <cursor>", "Pagination offset")
    .option("--is-initialized", "Only markets with market ledger")
    .action(async (options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const logger = createLogger({ verbose: globals.verbose });

      const status = options.status ?? "active";
      const sort = options.sort ?? "volume";
      const order = options.order ?? "desc";

      logger.debug("Fetching markets...");
      const data = await getMarkets({
        status,
        sort,
        order,
        limit: options.limit ? Number(options.limit) : undefined,
        cursor: options.cursor ? Number(options.cursor) : undefined,
        isInitialized: options.isInitialized ?? undefined,
      });

      const next =
        data.cursor !== null && data.cursor !== undefined
          ? `predictarena markets list --cursor ${data.cursor}`
          : undefined;

      printOutput(format, {
        data,
        pagination: { cursor: data.cursor },
        hints: buildHints({
          available_filters: [
            "--status",
            "--sort",
            "--order",
            "--limit",
            "--cursor",
            "--is-initialized",
          ],
          next,
          related: ["predictarena markets get <ticker>", "predictarena markets orderbook <ticker>"],
        }),
      });
    });

  const get = markets
    .command("get <ticker>")
    .description("Get a single market by ticker")
    .action(async (ticker, _options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const logger = createLogger({ verbose: globals.verbose });

      logger.debug(`Fetching market ${ticker}...`);
      const data = await getMarket(ticker);

      printOutput(format, {
        data,
        hints: buildHints({
          related: ["predictarena markets orderbook <ticker>"],
        }),
      });
    });

  const getByMint = markets
    .command("get-by-mint <mint>")
    .description("Get a market by outcome mint")
    .action(async (mint, _options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const logger = createLogger({ verbose: globals.verbose });

      logger.debug(`Fetching market by mint ${mint}...`);
      const data = await getMarketByMint(mint);

      printOutput(format, {
        data,
        hints: buildHints({
          related: ["predictarena markets get <ticker>"],
        }),
      });
    });

  const orderbook = markets
    .command("orderbook <ticker>")
    .description("Get orderbook by market ticker")
    .action(async (ticker, _options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const logger = createLogger({ verbose: globals.verbose });

      logger.debug(`Fetching orderbook ${ticker}...`);
      const data = await getOrderbookByTicker(ticker);

      printOutput(format, {
        data,
        hints: buildHints({
          related: ["predictarena markets get <ticker>"],
        }),
      });
    });

  const describe = markets
    .command("describe")
    .description("Describe market filters and schema")
    .action((_options, command) => {
      const globals = getGlobalOptions(command);
      const format = globals.json ? "json" : "plain";
      const data = marketsDescribeSchema();
      printOutput(format, { data });
    });

  applyGlobalOptions(markets);
  applyGlobalOptions(list);
  applyGlobalOptions(get);
  applyGlobalOptions(getByMint);
  applyGlobalOptions(orderbook);
  applyGlobalOptions(describe);
}
