import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: false,
  },
  resolve: {
    alias: {
      "campus-shield-shared": resolve(__dirname, "../shared/src/index.ts"),
    },
  },
});
