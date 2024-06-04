import terser from "@rollup/plugin-terser";

const config = {
  input: "src/index.js",
  output: {
    file: "dist/echox.js",
    name: "X",
    format: "umd",
  },
};

export default [
  config,
  {
    ...config,
    output: {
      ...config.output,
      file: "dist/echox.min.js",
    },
    plugins: [terser()],
  },
];
