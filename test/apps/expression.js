import {html, state} from "../../src/index.js";

export function expression() {
  return html`<define text=${state("hello world")}>
    <span>${(d) => d.text}</span>
  </define>`;
}
