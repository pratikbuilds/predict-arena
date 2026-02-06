import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, it, expect } from "vitest";

const exec = promisify(execFile);
const cli = "dist/bin.mjs";

describe("trades command", () => {
  it("lists trades as JSON", async () => {
    const { stdout } = await exec(
      "node",
      [cli, "trades", "list", "--limit", "3", "--json"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );
    const result = JSON.parse(stdout);
    expect(result.data.trades).toBeInstanceOf(Array);
    expect(result.data.trades.length).toBeGreaterThan(0);
    expect(result.data.trades[0]).toHaveProperty("tradeId");
  });

  it("returns describe schema as JSON", async () => {
    const { stdout } = await exec("node", [cli, "trades", "describe", "--json"], {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });
    const result = JSON.parse(stdout);
    expect(result.data).toHaveProperty("command", "predictarena trades list");
    expect(result.data.filters).toHaveProperty("ticker");
  });
});
