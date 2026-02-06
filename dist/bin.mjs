#!/usr/bin/env node
import { _ as searchEvents, a as getEvent, c as getMarketByMint, d as getOrderbookByTicker, f as getSeries, h as getTrades, l as getMarkets, m as getTagsByCategories, n as getOrderStatus, o as getEvents, p as getSeriesByTicker, s as getMarket, t as getOrder, v as ApiError, y as getSolanaRpcUrl } from "./trade-hdAe-DAn.mjs";
import { Command } from "commander";
import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";

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
//#region src/commands/wallet.ts
function registerWalletCommand(program) {
	applyGlobalOptions(program.command("wallet").description("Create or manage Solana keypair for agent signing").command("create <path>").description("Generate keypair, save to file, print public key for funding").action(async (pathArg, _options, command) => {
		const globals = getGlobalOptions(command);
		const logger = createLogger({ verbose: globals.verbose });
		const resolved = path.resolve(process.cwd(), pathArg);
		if (fs.existsSync(resolved)) {
			if (fs.statSync(resolved).isDirectory()) {
				logger.error("Path must be a file, not a directory.");
				process.exit(1);
			}
		}
		const dir = path.dirname(resolved);
		if (dir !== ".") fs.mkdirSync(dir, { recursive: true });
		logger.debug(`Generating keypair and writing to ${resolved}`);
		const keypair = Keypair.generate();
		fs.writeFileSync(resolved, JSON.stringify(Array.from(keypair.secretKey)), "utf8");
		const publicKey = keypair.publicKey.toBase58();
		if (globals.json) {
			printOutput("json", { data: {
				publicKey,
				path: resolved
			} });
			return;
		}
		console.log(`Wallet saved to ${resolved}`);
		console.log(`Public key: ${publicKey}`);
		console.log("Fund this address to use it.");
	}));
}

//#endregion
//#region src/utils/wallet.ts
var WalletLoadError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "WalletLoadError";
	}
};
function loadKeypairFromPath(filePath) {
	const resolved = path.resolve(process.cwd(), filePath);
	if (!fs.existsSync(resolved)) throw new WalletLoadError(`Wallet file not found: ${resolved}`);
	if (fs.statSync(resolved).isDirectory()) throw new WalletLoadError(`Path is a directory, expected a file: ${resolved}`);
	const raw = fs.readFileSync(resolved, "utf8");
	let arr;
	try {
		arr = JSON.parse(raw);
	} catch {
		throw new WalletLoadError(`Invalid JSON in wallet file: ${resolved}`);
	}
	if (!Array.isArray(arr) || arr.length !== 64) throw new WalletLoadError(`Wallet file must be a JSON array of 64 numbers (secret key): ${resolved}`);
	const secretKey = Uint8Array.from(arr);
	return Keypair.fromSecretKey(secretKey);
}

//#endregion
//#region src/utils/mintLabels.ts
const KNOWN_MINTS = {
	So11111111111111111111111111111111111111112: "SOL",
	EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
	CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH: "CASH"
};
/** Decimals for known mints (SOL=9, USDC=6, CASH=6). Used when order.routePlan is missing. */
const KNOWN_MINT_DECIMALS = {
	So11111111111111111111111111111111111111112: 9,
	EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 6,
	CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH: 6
};
function getMintLabel(mint, fallbackToShort = true) {
	const label = KNOWN_MINTS[mint];
	if (label) return label;
	if (fallbackToShort && mint.length >= 8) return `${mint.slice(0, 8)}…`;
	return mint;
}
function getMintDecimals(mint) {
	return KNOWN_MINT_DECIMALS[mint];
}

//#endregion
//#region src/utils/mintDecimals.ts
/**
* SPL Token (and Token-2022) mint account layout: decimals is a u8 at offset 41.
* Layout: mint_authority (COption<Pubkey>) 33 bytes, supply (u64) 8 bytes, decimals (u8) 1 byte.
*/
const MINT_DECIMALS_OFFSET = 41;
/**
* Fetch decimals for a mint from chain via getAccountInfo. Returns undefined if account missing or not a valid mint.
*/
async function getMintDecimalsOnChain(connection, mintAddress) {
	try {
		const accountInfo = await connection.getAccountInfo(new PublicKey(mintAddress));
		if (!accountInfo?.data || accountInfo.data.length < MINT_DECIMALS_OFFSET + 1) return void 0;
		return accountInfo.data[MINT_DECIMALS_OFFSET];
	} catch {
		return;
	}
}
/**
* Fetch decimals for multiple mints. Returns a map of mint -> decimals for those that succeeded.
*/
async function getMintDecimalsOnChainBatch(connection, mintAddresses) {
	const unique = [...new Set(mintAddresses)];
	const results = await Promise.all(unique.map(async (mint) => {
		return {
			mint,
			decimals: await getMintDecimalsOnChain(connection, mint)
		};
	}));
	const map = {};
	for (const { mint, decimals } of results) if (decimals !== void 0) map[mint] = decimals;
	return map;
}

//#endregion
//#region src/trading/signAndSend.ts
var TransactionParseError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "TransactionParseError";
	}
};
var QuoteExpiredError = class extends Error {
	constructor(message, lastValidBlockHeight, currentBlockHeight) {
		super(message);
		this.lastValidBlockHeight = lastValidBlockHeight;
		this.currentBlockHeight = currentBlockHeight;
		this.name = "QuoteExpiredError";
	}
};
/**
* Deserialize base64-encoded transaction from DFlow order response.
* Throws TransactionParseError if order has no transaction or invalid base64.
*/
function parseTransactionFromOrder(order) {
	const raw = order.transaction;
	if (!raw || typeof raw !== "string") throw new TransactionParseError("Order response did not include a transaction; ensure userPublicKey was provided and the order is valid.");
	let buffer;
	try {
		buffer = Buffer.from(raw, "base64");
	} catch {
		throw new TransactionParseError("Order transaction is not valid base64.");
	}
	if (buffer.length === 0) throw new TransactionParseError("Order transaction is empty.");
	try {
		return VersionedTransaction.deserialize(buffer);
	} catch (err) {
		throw new TransactionParseError(`Failed to deserialize transaction: ${err instanceof Error ? err.message : String(err)}`);
	}
}
/**
* Sign the transaction with the keypair and submit to the RPC.
* Confirms using blockheight strategy when lastValidBlockHeight is set.
* Throws QuoteExpiredError if current block height >= lastValidBlockHeight.
*/
async function signAndSend(connection, order, keypair, options = {}) {
	const lastValid = order.lastValidBlockHeight;
	if (lastValid != null) {
		const current = await connection.getBlockHeight("confirmed");
		if (current >= lastValid) throw new QuoteExpiredError(`Quote expired: current block height ${current} >= lastValidBlockHeight ${lastValid}. Request a fresh order.`, lastValid, current);
	}
	const tx = parseTransactionFromOrder(order);
	tx.sign([keypair]);
	const serialized = Buffer.from(tx.serialize());
	const skipPreflight = options.skipPreflight ?? false;
	const commitment = options.commitment ?? "confirmed";
	const skipConfirm = options.skipConfirm ?? false;
	const signature = await connection.sendRawTransaction(serialized, {
		skipPreflight,
		preflightCommitment: commitment
	});
	if (skipConfirm) return signature;
	if (lastValid != null) {
		const blockhash = tx.message.recentBlockhash;
		await connection.confirmTransaction({
			signature,
			lastValidBlockHeight: lastValid,
			blockhash
		}, commitment);
		return signature;
	}
	await connection.confirmTransaction(signature, commitment);
	return signature;
}

//#endregion
//#region src/commands/trade.ts
async function resolveMarketContext(outputMint, inputMint) {
	for (const mint of [outputMint, inputMint]) try {
		const market = await getMarketByMint(mint);
		return {
			marketTicker: market.ticker,
			eventTicker: market.eventTicker,
			marketTitle: market.title
		};
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) continue;
		throw err;
	}
	return null;
}
function getOrderDecimals(order, decimalsMap) {
	const legs = order.routePlan;
	if (legs?.length) {
		const first = legs[0];
		const last = legs[legs.length - 1];
		return {
			inputMintDecimals: first.inputMintDecimals,
			outputMintDecimals: last.outputMintDecimals
		};
	}
	return {
		inputMintDecimals: decimalsMap?.[order.inputMint] ?? getMintDecimals(order.inputMint),
		outputMintDecimals: decimalsMap?.[order.outputMint] ?? getMintDecimals(order.outputMint)
	};
}
function buildTradeSummary(order, market) {
	const inLabel = getMintLabel(order.inputMint);
	const outLabel = getMintLabel(order.outputMint);
	const mode = order.executionMode;
	let line = `Trade: ${order.inAmount} ${inLabel} → ${order.outAmount} ${outLabel} [${mode}]`;
	if (market) line += `\nMarket: ${market.eventTicker} / ${market.marketTicker}`;
	return line;
}
function buildTradeData(order, market, decimalsMap) {
	const { inputMintDecimals, outputMintDecimals } = getOrderDecimals(order, decimalsMap);
	const trade = {
		inputMint: order.inputMint,
		outputMint: order.outputMint,
		inAmount: order.inAmount,
		outAmount: order.outAmount,
		inputMintDecimals: inputMintDecimals ?? void 0,
		outputMintDecimals: outputMintDecimals ?? void 0,
		executionMode: order.executionMode,
		minOutAmount: order.minOutAmount,
		priceImpactPct: order.priceImpactPct,
		lastValidBlockHeight: order.lastValidBlockHeight ?? void 0
	};
	if (market) {
		trade.marketTicker = market.marketTicker;
		trade.eventTicker = market.eventTicker;
		trade.marketTitle = market.marketTitle;
	}
	return trade;
}
function registerTradeCommand(program) {
	applyGlobalOptions(program.command("trade").description("Execute a swap (input mint → output mint) using a wallet keypair").requiredOption("--wallet <path>", "Path to wallet keypair JSON file").requiredOption("--input-mint <mint>", "Input token mint address").requiredOption("--output-mint <mint>", "Output token mint address").requiredOption("--amount <raw>", "Input amount (raw integer, e.g. 1000000 for 1 USDC)", (v) => Number(v)).option("--slippage-bps <bps>", "Slippage in basis points (default: 50)", (v) => v === "auto" ? "auto" : Number(v), 50).option("--priority <level>", "Priority fee: auto, medium, high, veryHigh, disabled, or lamports number", (v) => [
		"auto",
		"medium",
		"high",
		"veryHigh",
		"disabled"
	].includes(v) ? v : Number(v), "auto").option("--rpc <url>", "Solana RPC URL (or set SOLANA_RPC_URL / PREDICTARENA_RPC_URL)").option("--dry-run", "Fetch order and print quote only; do not sign or send").option("--no-confirm", "Send transaction but do not wait for confirmation").option("--skip-preflight", "Skip preflight simulation (default: false)").action(async (options, command) => {
		const globals = getGlobalOptions(command);
		const logger = createLogger({ verbose: globals.verbose });
		const format = globals.json ? "json" : "plain";
		const walletPath = options.wallet || process.env.PREDICTARENA_WALLET || process.env.WALLET_PATH;
		if (!walletPath) {
			logger.error("Wallet path required: use --wallet <path> or set PREDICTARENA_WALLET.");
			process.exit(1);
		}
		let keypair;
		try {
			keypair = loadKeypairFromPath(walletPath);
		} catch (err) {
			if (err instanceof WalletLoadError) {
				logger.error(err.message);
				process.exit(1);
			}
			throw err;
		}
		const userPublicKey = keypair.publicKey.toBase58();
		const slippageBps = options.slippageBps;
		const prioritizationFeeLamports = options.priority;
		logger.debug("Fetching order...");
		let order;
		try {
			order = await getOrder({
				inputMint: options.inputMint,
				outputMint: options.outputMint,
				amount: options.amount,
				userPublicKey,
				slippageBps: slippageBps === "auto" ? "auto" : slippageBps,
				prioritizationFeeLamports: typeof prioritizationFeeLamports === "string" ? prioritizationFeeLamports : prioritizationFeeLamports
			});
		} catch (err) {
			if (err instanceof ApiError) {
				logger.error(`Order failed (${err.status}): ${JSON.stringify(err.body)}`);
				process.exit(1);
			}
			throw err;
		}
		let decimalsMap = {};
		const rpcUrlForDecimals = options.rpc || getSolanaRpcUrl();
		if (rpcUrlForDecimals) try {
			decimalsMap = await getMintDecimalsOnChainBatch(new Connection(rpcUrlForDecimals), [order.inputMint, order.outputMint]);
		} catch {}
		let market = null;
		try {
			market = await resolveMarketContext(order.outputMint, order.inputMint);
		} catch (err) {
			if (err instanceof ApiError && err.status !== 404) {
				logger.error(`Market lookup failed: ${err.message}`);
				process.exit(1);
			}
		}
		const summary = buildTradeSummary(order, market);
		const tradeData = buildTradeData(order, market, decimalsMap);
		if (options.dryRun) {
			if (format === "json") printOutput("json", { data: {
				trade: tradeData,
				dryRun: true,
				quote: {
					minOutAmount: order.minOutAmount,
					priceImpactPct: order.priceImpactPct,
					lastValidBlockHeight: order.lastValidBlockHeight
				},
				message: "Dry run — no transaction signed or sent."
			} });
			else {
				console.log(summary);
				console.log(`Min out amount: ${order.minOutAmount}`);
				console.log(`Price impact: ${order.priceImpactPct}%`);
				if (order.lastValidBlockHeight != null) console.log(`Last valid block height: ${order.lastValidBlockHeight}`);
				console.log("Dry run — no transaction signed or sent.");
			}
			return;
		}
		if (!order.transaction) {
			logger.error("Order response did not include a transaction. Check userPublicKey and order parameters.");
			process.exit(1);
		}
		const rpcUrl = options.rpc || getSolanaRpcUrl();
		if (!rpcUrl) {
			logger.error("RPC URL required: use --rpc <url> or set SOLANA_RPC_URL / PREDICTARENA_RPC_URL.");
			process.exit(1);
		}
		const skipConfirm = options.confirm === false;
		if (!skipConfirm && order.lastValidBlockHeight == null) {
			logger.error("Order has no lastValidBlockHeight; use --no-confirm to send without confirmation.");
			process.exit(1);
		}
		const connection = new Connection(rpcUrl, "confirmed");
		try {
			const signature = await signAndSend(connection, order, keypair, {
				skipPreflight: options.skipPreflight ?? false,
				commitment: "confirmed",
				skipConfirm
			});
			let orderStatus;
			try {
				orderStatus = await getOrderStatus(signature, order.lastValidBlockHeight ?? void 0);
			} catch {
				orderStatus = void 0;
			}
			if (format === "json") printOutput("json", { data: {
				trade: tradeData,
				result: {
					signature,
					confirmed: !skipConfirm,
					orderStatus: orderStatus ?? void 0
				}
			} });
			else {
				console.log(summary);
				console.log(`Signature: ${signature}`);
				console.log(skipConfirm ? "Sent (not confirmed)." : "Confirmed.");
			}
		} catch (err) {
			if (err instanceof QuoteExpiredError) {
				logger.error(err.message);
				process.exit(1);
			}
			if (err instanceof TransactionParseError) {
				logger.error(err.message);
				process.exit(1);
			}
			throw err;
		}
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
registerWalletCommand(program);
registerTradeCommand(program);
program.parseAsync(process.argv);

//#endregion
export {  };
//# sourceMappingURL=bin.mjs.map