import type { Command } from "commander";

export interface GlobalOptions {
  json: boolean;
  verbose: boolean;
}

export function applyGlobalOptions(command: Command): void {
  command.option("--json", "Output full JSON payloads");
  command.option("--verbose", "Enable verbose logging");
}

export function getGlobalOptions(command: Command): GlobalOptions {
  const local = command.opts?.() ?? {};
  let current: Command | null = command;
  while (current?.parent) current = current.parent;
  const opts = current?.opts?.() ?? {};
  return {
    json: Boolean(local.json ?? opts.json),
    verbose: Boolean(local.verbose ?? opts.verbose),
  };
}
