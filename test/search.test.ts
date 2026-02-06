import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, it, expect } from "vitest";

const exec = promisify(execFile);
const cli = "dist/bin.mjs";

describe("search command", () => {
  it("searches events as JSON", async () => {
    const { stdout } = await exec(
      "node",
      [cli, "search", "bitcoin", "--limit", "3", "--json"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );
    const result = JSON.parse(stdout);
    expect(result.data.events).toBeInstanceOf(Array);
    expect(result.data.events.length).toBeGreaterThan(0);
    expect(result.data.events[0]).toHaveProperty("ticker");
  });
});
