import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/env.ts"],
    globalSetup: ["./test/setup.ts"],
    fileParallelism: false, // prevent cleanupAgents from one file deleting another's agent
  },
});
