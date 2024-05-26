import {html, state, css, cx} from "../../src/index.js";

export function style() {
  return html`<define>
    <span class=${cx(null, "a", undefined, new Date(), {b: true}, {c: false, d: true, e: new Date()})}>Hello</span>
    <span style=${css({backgroundColor: "red"}, {backgroundColor: "blue"}, false && {backgroundColor: "yellow"})}>
      World
    </span>
  </define>`;
}
