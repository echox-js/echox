import {defineConfig} from "vite";

export default defineConfig({
  root: "./test",
  test: {
    globals: true,
    environment: "jsdom",
  },
});
