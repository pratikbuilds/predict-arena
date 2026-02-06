import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, it, expect } from "vitest";

const exec = promisify(execFile);
const cli = "dist/bin.mjs";

describe("markets command", () => {
  it("lists markets as JSON", async () => {
    const { stdout } = await exec(
      "node",
      [cli, "markets", "list", "--limit", "2", "--json"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );
    const result = JSON.parse(stdout);
    expect(result.data.markets).toBeInstanceOf(Array);
    expect(result.data.markets.length).toBeGreaterThan(0);
    expect(result.data.markets[0]).toHaveProperty("ticker");
  });

  it("gets a market by ticker, by mint, and orderbook", async () => {
    const { stdout } = await exec(
      "node",
      [cli, "markets", "list", "--limit", "1", "--json"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );
    const list = JSON.parse(stdout);
    const market = list.data.markets[0];
    const ticker = market?.ticker;
    const accountValues = Object.values(market?.accounts ?? {});
    const yesMint = accountValues[0]?.yesMint;

    expect(typeof ticker).toBe("string");
    expect(typeof yesMint).toBe("string");

    const { stdout: marketStdout } = await exec(
      "node",
      [cli, "markets", "get", ticker, "--json"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );
    const marketDetail = JSON.parse(marketStdout);
    expect(marketDetail.data).toHaveProperty("ticker", ticker);

    const { stdout: mintStdout } = await exec(
      "node",
      [cli, "markets", "get-by-mint", yesMint, "--json"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );
    const mintDetail = JSON.parse(mintStdout);
    expect(mintDetail.data).toHaveProperty("ticker");

    const { stdout: orderbookStdout } = await exec(
      "node",
      [cli, "markets", "orderbook", ticker, "--json"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );
    const orderbook = JSON.parse(orderbookStdout);
    expect(orderbook.data).toBeTypeOf("object");
  });

  it("returns describe schema as JSON", async () => {
    const { stdout } = await exec("node", [cli, "markets", "describe", "--json"], {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });
    const result = JSON.parse(stdout);
    expect(result.data).toHaveProperty("command", "predictarena markets list");
    expect(result.data.filters).toHaveProperty("status");
  });
});
