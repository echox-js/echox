import {html, component, state} from "../../src/index.js";

const App = component`<define count=${state(0)}>
  <button @click=${(d) => d.count++}>👍</button>
  <button @click=${(d) => d.count--}>👎</button>
  <span>
    ${(d) => d.count}
  </span>
  </define>
`;

export function app() {
  return html(App);
}
