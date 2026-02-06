import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, it, expect } from "vitest";

const exec = promisify(execFile);
const cli = "dist/bin.mjs";

describe("series command", () => {
  it("lists series by category as JSON", async () => {
    const { stdout } = await exec("node", [cli, "series", "--category", "Economics", "--json"], {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });
    const result = JSON.parse(stdout);
    expect(result.data.series).toBeInstanceOf(Array);
    expect(result.data.series.length).toBeGreaterThan(0);
    expect(result.data.series[0]).toHaveProperty("ticker");
  });

  it("gets a series by ticker as JSON", async () => {
    const { stdout } = await exec("node", [cli, "series", "--category", "Economics", "--json"], {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });
    const list = JSON.parse(stdout);
    const ticker = list.data.series[0]?.ticker;
    expect(typeof ticker).toBe("string");

    const { stdout: detailStdout } = await exec(
      "node",
      [cli, "series", "get", ticker, "--json"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );
    const detail = JSON.parse(detailStdout);
    expect(detail.data).toHaveProperty("ticker", ticker);
  });
});
