import {defineConfig} from "vite";
import path from "path";

export default defineConfig({
  root: "./test",
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    alias: {
      echox: path.resolve("./src/index.js"),
    },
  },
});
