import {defineConfig} from "genji-theme-docusaurus/config";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";

const EchoX = ExecutionEnvironment.canUseDOM ? require("echox") : {};

// More props: https://genji-md.dev/reference/props
export default defineConfig({
  library: {
    EchoX,
    html: EchoX.html,
  },
  transform: {
    echox(code) {
      return `
        (() => {
          const App = ${code};
          const container = document.createElement("div");
          requestAnimationFrame(() => {
            EchoX.mount(container, App());
          });
          unsubscribe(() => {
            EchoX.unmount(container);
          })
          return container;
        })()
      `;
    },
  },
});
