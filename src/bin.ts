#!/usr/bin/env node
import { Command } from "commander";
import { registerCategoriesCommand } from "./commands/categories";
import { registerSeriesCommand } from "./commands/series";
import { registerEventsCommand } from "./commands/events";
import { registerMarketsCommand } from "./commands/markets";
import { registerTradesCommand } from "./commands/trades";
import { registerSearchCommand } from "./commands/search";
import { registerWalletCommand } from "./commands/wallet";
import { registerTradeCommand } from "./commands/trade";

const program = new Command();

program
  .name("predictarena")
  .description("PredictArena CLI for DFlow prediction markets")
  .option("--json", "Output full JSON payloads")
  .option("--verbose", "Enable verbose logging");

registerCategoriesCommand(program);
registerSeriesCommand(program);
registerEventsCommand(program);
registerMarketsCommand(program);
registerTradesCommand(program);
registerSearchCommand(program);
registerWalletCommand(program);
registerTradeCommand(program);

program.parseAsync(process.argv);
