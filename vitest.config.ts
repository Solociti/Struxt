import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["dist-server", "client/dist", "node_modules"],
  },
});
