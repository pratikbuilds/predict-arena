import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/env.ts"],
    globalSetup: ["./test/setup.ts"],
  },
});
