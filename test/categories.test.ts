import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, it, expect } from "vitest";

const exec = promisify(execFile);
const cli = "dist/bin.mjs";

describe("categories command", () => {
  it("returns tags by categories as full JSON", async () => {
    const { stdout } = await exec("node", [cli, "categories", "--json"], {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty("data.tagsByCategories");
    expect(typeof result.data.tagsByCategories).toBe("object");
    expect(result._hints?.related?.length).toBeGreaterThan(0);
  });
});
