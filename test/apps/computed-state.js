import {html, state} from "../../src/index.js";

export function computedState() {
  return html`<fragment
    message=${state("hello")}
    reversed=${state((d) => d.message.split("").reverse().join(""))}
  >
    <input value=${(d) => d.message} @input=${(d, e) => (d.message = e.target.value)} />
    <p>Reversed: ${(d) => d.reversed}</p>
  </fragment>`;
}
