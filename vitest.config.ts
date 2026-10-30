import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["dist-server", "client/dist", "node_modules"],
    globalSetup: ["./test/globalSetup.ts"],
    setupFiles: ["./server/database/mongodbSetup.test.ts"],
  },
});
