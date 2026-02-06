import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, it, expect } from "vitest";

const exec = promisify(execFile);
const cli = "dist/bin.mjs";

describe("events command", () => {
  it("lists events with filters as JSON", async () => {
    const { stdout } = await exec(
      "node",
      [cli, "events", "list", "--limit", "5", "--json"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );
    const result = JSON.parse(stdout);
    expect(result.data.events).toBeInstanceOf(Array);
    expect(result.data.events.length).toBeGreaterThan(0);
    expect(result.data.events[0]).toHaveProperty("ticker");
  });

  it("gets a single event by ticker as JSON", async () => {
    const { stdout } = await exec(
      "node",
      [cli, "events", "list", "--limit", "1", "--json"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );
    const list = JSON.parse(stdout);
    const ticker = list.data.events[0]?.ticker;
    expect(typeof ticker).toBe("string");

    const { stdout: detailStdout } = await exec(
      "node",
      [cli, "events", "get", ticker, "--json"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );
    const detail = JSON.parse(detailStdout);
    expect(detail.data).toHaveProperty("ticker", ticker);
  });

  it("returns describe schema as JSON", async () => {
    const { stdout } = await exec("node", [cli, "events", "describe", "--json"], {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });
    const result = JSON.parse(stdout);
    expect(result.data).toHaveProperty("command", "predictarena events list");
    expect(result.data.filters).toHaveProperty("status");
  });
});
