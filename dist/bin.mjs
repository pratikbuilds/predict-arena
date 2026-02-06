#!/usr/bin/env node
import { a as getMarketByMint, c as getOrderbookByTicker, d as getTagsByCategories, f as getTrades, i as getMarket, l as getSeries, m as searchEvents, n as getEvent, o as getMarkets, r as getEvents, u as getSeriesByTicker } from "./metadata-W-pHA1-K.mjs";
import { Command } from "commander";
import chalk from "chalk";

//#region src/utils/hints.ts
function eventsDescribeSchema() {
	return {
		command: "predictarena events list",
		defaults: {
			status: "active",
			limit: 20,
			sort: "volume"
		},
		filters: {
			status: {
				type: "enum",
				values: [
					"initialized",
					"active",
					"inactive",
					"closed",
					"determined",
					"finalized"
				]
			},
			sort: {
				type: "enum",
				values: [
					"volume",
					"volume24h",
					"liquidity",
					"openInterest",
					"startDate"
				]
			},
			order: {
				type: "enum",
				values: ["asc", "desc"],
				default: "desc"
			},
			seriesTickers: {
				type: "string",
				description: "Comma-separated series tickers (max 25)."
			},
			isInitialized: {
				type: "boolean",
				description: "Filter to events with market ledger."
			},
			withNestedMarkets: {
				type: "boolean",
				default: true
			},
			limit: {
				type: "number",
				default: 20
			},
			cursor: {
				type: "number",
				description: "Pagination offset."
			}
		},
		discovery_flow: [
			"predictarena categories        -- browse categories and tags",
			"predictarena series --category Sports  -- get series tickers",
			"predictarena events list --series <ticker> -- filter events"
		]
	};
}
function marketsDescribeSchema() {
	return {
		command: "predictarena markets list",
		defaults: {
			status: "active",
			limit: 20,
			sort: "volume"
		},
		filters: {
			status: {
				type: "enum",
				values: [
					"initialized",
					"active",
					"inactive",
					"closed",
					"determined",
					"finalized"
				]
			},
			sort: {
				type: "enum",
				values: [
					"volume",
					"volume24h",
					"liquidity",
					"openInterest",
					"startDate"
				]
			},
			order: {
				type: "enum",
				values: ["asc", "desc"],
				default: "desc"
			},
			isInitialized: {
				type: "boolean",
				description: "Filter to markets with market ledger."
			},
			limit: {
				type: "number",
				default: 20
			},
			cursor: {
				type: "number",
				description: "Pagination offset."
			}
		}
	};
}
function seriesDescribeSchema() {
	return {
		command: "predictarena series",
		filters: {
			category: {
				type: "string",
				description: "Series category filter."
			},
			tags: {
				type: "string",
				description: "Comma-separated tags."
			},
			status: {
				type: "enum",
				values: [
					"initialized",
					"active",
					"inactive",
					"closed",
					"determined",
					"finalized"
				]
			},
			isInitialized: {
				type: "boolean",
				description: "Filter to series with market ledger."
			}
		}
	};
}
function tradesDescribeSchema() {
	return {
		command: "predictarena trades list",
		filters: {
			ticker: {
				type: "string",
				description: "Market ticker filter."
			},
			minTs: {
				type: "number",
				description: "Min unix timestamp."
			},
			maxTs: {
				type: "number",
				description: "Max unix timestamp."
			},
			limit: {
				type: "number",
				description: "Max trades (1-1000)."
			},
			cursor: {
				type: "string",
				description: "Pagination cursor (trade ID)."
			}
		}
	};
}
function buildHints(hints) {
	return hints;
}

//#endregion
//#region src/utils/cli.ts
function applyGlobalOptions(command) {
	command.option("--json", "Output full JSON payloads");
	command.option("--verbose", "Enable verbose logging");
}
function getGlobalOptions(command) {
	const local = command.opts?.() ?? {};
	let current = command;
	while (current?.parent) current = current.parent;
	const opts = current?.opts?.() ?? {};
	return {
		json: Boolean(local.json ?? opts.json),
		verbose: Boolean(local.verbose ?? opts.verbose)
	};
}

//#endregion
//#region src/utils/logger.ts
function createLogger(opts) {
	const verbose = Boolean(opts?.verbose);
	return {
		info: (message) => console.log(message),
		warn: (message) => console.warn(chalk.yellow(message)),
		error: (message) => console.error(chalk.red(message)),
		debug: (message) => {
			if (verbose) console.log(chalk.gray(message));
		}
	};
}

//#endregion
//#region src/utils/output.ts
function printOutput(format, payload) {
	if (format === "json") {
		const out = {
			data: payload.data,
			pagination: payload.pagination ?? null,
			_hints: payload.hints ?? null
		};
		console.log(JSON.stringify(out, null, 2));
		return;
	}
	const dataJson = JSON.stringify(payload.data, null, 2);
	console.log(dataJson);
	if (payload.pagination) {
		console.log("\nPagination:");
		console.log(JSON.stringify(payload.pagination, null, 2));
	}
	if (payload.hints) {
		console.log("\nHints:");
		console.log(renderHints(payload.hints));
	}
}
function renderHints(hints) {
	const lines = [];
	if (hints.available_filters?.length) lines.push(`Filters: ${hints.available_filters.join(", ")}`);
	if (hints.next) lines.push(`Next: ${hints.next}`);
	if (hints.related?.length) lines.push(`Related: ${hints.related.join(", ")}`);
	if (hints.notes?.length) lines.push(`Notes: ${hints.notes.join(" | ")}`);
	return lines.join("\n");
}

//#endregion
//#region src/commands/categories.ts
function registerCategoriesCommand(program) {
	applyGlobalOptions(program.command("categories").description("List tags grouped by categories").action(async (_options, command) => {
		const globals = getGlobalOptions(command);
		const format = globals.json ? "json" : "plain";
		createLogger({ verbose: globals.verbose }).debug("Fetching tags by categories...");
		printOutput(format, {
			data: await getTagsByCategories(),
			hints: buildHints({
				related: ["predictarena series --category <category>", "predictarena events list"],
				notes: ["Use categories + tags to discover series tickers."]
			})
		});
	}));
}

//#endregion
//#region src/commands/series.ts
function registerSeriesCommand(program) {
	const series = program.command("series").description("List series templates").option("--category <category>", "Filter by category").option("--tags <tags>", "Filter by comma-separated tags").option("--status <status>", "Filter by status").option("--is-initialized", "Only series with market ledger").action(async (options, command) => {
		const globals = getGlobalOptions(command);
		const format = globals.json ? "json" : "plain";
		createLogger({ verbose: globals.verbose }).debug("Fetching series...");
		printOutput(format, {
			data: await getSeries({
				category: options.category,
				tags: options.tags,
				status: options.status,
				isInitialized: options.isInitialized ?? void 0
			}),
			hints: buildHints({
				available_filters: [
					"--category",
					"--tags",
					"--status",
					"--is-initialized"
				],
				related: ["predictarena series get <ticker>", "predictarena events list"],
				notes: ["Use series tickers with events list --seriesTickers."]
			})
		});
	});
	const get = series.command("get <ticker>").description("Get a series by ticker").action(async (ticker, _options, command) => {
		const globals = getGlobalOptions(command);
		const format = globals.json ? "json" : "plain";
		createLogger({ verbose: globals.verbose }).debug(`Fetching series ${ticker}...`);
		printOutput(format, {
			data: await getSeriesByTicker(ticker),
			hints: buildHints({ related: ["predictarena events list --seriesTickers <ticker>"] })
		});
	});
	const describe = series.command("describe").description("Describe series filters and schema").action((_options, command) => {
		printOutput(getGlobalOptions(command).json ? "json" : "plain", { data: seriesDescribeSchema() });
	});
	applyGlobalOptions(series);
	applyGlobalOptions(get);
	applyGlobalOptions(describe);
}

//#endregion
//#region src/commands/events.ts
function registerEventsCommand(program) {
	const events = program.command("events").description("Discover events");
	const list = events.command("list").description("List events with filters").option("--status <status>", "Event status (default: active)").option("--sort <sort>", "Sort field (default: volume)").option("--order <order>", "Sort order (default: desc)").option("--series-tickers <tickers>", "Comma-separated series tickers (max 25)").option("--limit <limit>", "Max results").option("--cursor <cursor>", "Pagination offset").option("--is-initialized", "Only events with market ledger").option("--with-nested-markets", "Include nested markets").action(async (options, command) => {
		const globals = getGlobalOptions(command);
		const format = globals.json ? "json" : "plain";
		const logger = createLogger({ verbose: globals.verbose });
		const status = options.status ?? "active";
		const sort = options.sort ?? "volume";
		const order = options.order ?? "desc";
		const withNestedMarkets = options.withNestedMarkets === void 0 ? true : options.withNestedMarkets;
		logger.debug("Fetching events...");
		const data = await getEvents({
			status,
			sort,
			order,
			limit: options.limit ? Number(options.limit) : void 0,
			cursor: options.cursor ? Number(options.cursor) : void 0,
			seriesTickers: options.seriesTickers,
			isInitialized: options.isInitialized ?? void 0,
			withNestedMarkets
		});
		const next = data.cursor !== null && data.cursor !== void 0 ? `predictarena events list --cursor ${data.cursor}` : void 0;
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
					"--with-nested-markets"
				],
				next,
				related: ["predictarena categories", "predictarena series"]
			})
		});
	});
	const get = events.command("get <ticker>").description("Get a single event by ticker").option("--with-nested-markets", "Include nested markets").action(async (ticker, options, command) => {
		const globals = getGlobalOptions(command);
		const format = globals.json ? "json" : "plain";
		const logger = createLogger({ verbose: globals.verbose });
		const withNestedMarkets = options.withNestedMarkets === void 0 ? true : options.withNestedMarkets;
		logger.debug(`Fetching event ${ticker}...`);
		printOutput(format, {
			data: await getEvent(ticker, { withNestedMarkets }),
			hints: buildHints({ related: ["predictarena markets list", "predictarena markets get <ticker>"] })
		});
	});
	const describe = events.command("describe").description("Describe event filters and schema").action((_options, command) => {
		printOutput(getGlobalOptions(command).json ? "json" : "plain", { data: eventsDescribeSchema() });
	});
	applyGlobalOptions(events);
	applyGlobalOptions(list);
	applyGlobalOptions(get);
	applyGlobalOptions(describe);
}

//#endregion
//#region src/commands/markets.ts
function registerMarketsCommand(program) {
	const markets = program.command("markets").description("Discover markets");
	const list = markets.command("list").description("List markets with filters").option("--status <status>", "Market status (default: active)").option("--sort <sort>", "Sort field (default: volume)").option("--order <order>", "Sort order (default: desc)").option("--limit <limit>", "Max results").option("--cursor <cursor>", "Pagination offset").option("--is-initialized", "Only markets with market ledger").action(async (options, command) => {
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
			limit: options.limit ? Number(options.limit) : void 0,
			cursor: options.cursor ? Number(options.cursor) : void 0,
			isInitialized: options.isInitialized ?? void 0
		});
		const next = data.cursor !== null && data.cursor !== void 0 ? `predictarena markets list --cursor ${data.cursor}` : void 0;
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
					"--is-initialized"
				],
				next,
				related: ["predictarena markets get <ticker>", "predictarena markets orderbook <ticker>"]
			})
		});
	});
	const get = markets.command("get <ticker>").description("Get a single market by ticker").action(async (ticker, _options, command) => {
		const globals = getGlobalOptions(command);
		const format = globals.json ? "json" : "plain";
		createLogger({ verbose: globals.verbose }).debug(`Fetching market ${ticker}...`);
		printOutput(format, {
			data: await getMarket(ticker),
			hints: buildHints({ related: ["predictarena markets orderbook <ticker>"] })
		});
	});
	const getByMint = markets.command("get-by-mint <mint>").description("Get a market by outcome mint").action(async (mint, _options, command) => {
		const globals = getGlobalOptions(command);
		const format = globals.json ? "json" : "plain";
		createLogger({ verbose: globals.verbose }).debug(`Fetching market by mint ${mint}...`);
		printOutput(format, {
			data: await getMarketByMint(mint),
			hints: buildHints({ related: ["predictarena markets get <ticker>"] })
		});
	});
	const orderbook = markets.command("orderbook <ticker>").description("Get orderbook by market ticker").action(async (ticker, _options, command) => {
		const globals = getGlobalOptions(command);
		const format = globals.json ? "json" : "plain";
		createLogger({ verbose: globals.verbose }).debug(`Fetching orderbook ${ticker}...`);
		printOutput(format, {
			data: await getOrderbookByTicker(ticker),
			hints: buildHints({ related: ["predictarena markets get <ticker>"] })
		});
	});
	const describe = markets.command("describe").description("Describe market filters and schema").action((_options, command) => {
		printOutput(getGlobalOptions(command).json ? "json" : "plain", { data: marketsDescribeSchema() });
	});
	applyGlobalOptions(markets);
	applyGlobalOptions(list);
	applyGlobalOptions(get);
	applyGlobalOptions(getByMint);
	applyGlobalOptions(orderbook);
	applyGlobalOptions(describe);
}

//#endregion
//#region src/commands/trades.ts
function registerTradesCommand(program) {
	const trades = program.command("trades").description("Trade history");
	const list = trades.command("list").description("List trades with filters").option("--ticker <ticker>", "Filter by market ticker").option("--min-ts <timestamp>", "Min unix timestamp").option("--max-ts <timestamp>", "Max unix timestamp").option("--limit <limit>", "Limit trades (1-1000)").option("--cursor <cursor>", "Pagination cursor (trade ID)").action(async (options, command) => {
		const globals = getGlobalOptions(command);
		const format = globals.json ? "json" : "plain";
		createLogger({ verbose: globals.verbose }).debug("Fetching trades...");
		const data = await getTrades({
			ticker: options.ticker,
			minTs: options.minTs ? Number(options.minTs) : void 0,
			maxTs: options.maxTs ? Number(options.maxTs) : void 0,
			limit: options.limit ? Number(options.limit) : void 0,
			cursor: options.cursor
		});
		const next = data.cursor !== null && data.cursor !== void 0 ? `predictarena trades list --cursor ${data.cursor}` : void 0;
		printOutput(format, {
			data,
			pagination: { cursor: data.cursor },
			hints: buildHints({
				available_filters: [
					"--ticker",
					"--min-ts",
					"--max-ts",
					"--limit",
					"--cursor"
				],
				next,
				related: ["predictarena markets list", "predictarena events list"]
			})
		});
	});
	const describe = trades.command("describe").description("Describe trades filters and schema").action((_options, command) => {
		printOutput(getGlobalOptions(command).json ? "json" : "plain", { data: tradesDescribeSchema() });
	});
	applyGlobalOptions(trades);
	applyGlobalOptions(list);
	applyGlobalOptions(describe);
}

//#endregion
//#region src/commands/search.ts
function registerSearchCommand(program) {
	applyGlobalOptions(program.command("search <query>").description("Search events by title or ticker").option("--sort <sort>", "Sort field").option("--order <order>", "Sort order").option("--limit <limit>", "Limit results").option("--cursor <cursor>", "Pagination offset").option("--with-nested-markets", "Include nested markets").option("--with-market-accounts", "Include market account info").action(async (query, options, command) => {
		const globals = getGlobalOptions(command);
		const format = globals.json ? "json" : "plain";
		const logger = createLogger({ verbose: globals.verbose });
		const withNestedMarkets = options.withNestedMarkets === void 0 ? true : options.withNestedMarkets;
		logger.debug(`Searching events for: ${query}`);
		const data = await searchEvents({
			q: query,
			sort: options.sort,
			order: options.order,
			limit: options.limit ? Number(options.limit) : void 0,
			cursor: options.cursor ? Number(options.cursor) : void 0,
			withNestedMarkets,
			withMarketAccounts: options.withMarketAccounts ?? void 0
		});
		const next = data.cursor !== null && data.cursor !== void 0 ? `predictarena search "${query}" --cursor ${data.cursor}` : void 0;
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
					"--with-market-accounts"
				],
				next,
				related: ["predictarena events list", "predictarena markets list"]
			})
		});
	}));
}

//#endregion
//#region src/bin.ts
const program = new Command();
program.name("predictarena").description("PredictArena CLI for DFlow prediction markets").option("--json", "Output full JSON payloads").option("--verbose", "Enable verbose logging");
registerCategoriesCommand(program);
registerSeriesCommand(program);
registerEventsCommand(program);
registerMarketsCommand(program);
registerTradesCommand(program);
registerSearchCommand(program);
program.parseAsync(process.argv);

//#endregion
export {  };
//# sourceMappingURL=bin.mjs.map