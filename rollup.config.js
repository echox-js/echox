import terser from "@rollup/plugin-terser";

const config = {
  input: "src/index.js",
  output: {
    file: "dist/eco.js",
    name: "eco",
    format: "umd",
  },
};

export default [
  config,
  {
    ...config,
    output: {
      ...config.output,
      file: "dist/eco.min.js",
    },
    plugins: [terser()],
  },
];
