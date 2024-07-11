import {defineConfig} from "vitest/config";
import path from "path";

export default defineConfig({
  root: "./test",
  test: {
    environment: "jsdom",
  },
  resolve: {
    alias: {
      echox: path.resolve("./src/index.js"),
    },
  },
});
