import {html, state, component, prop} from "../../src/index.js";

const counter = component`<fragment value=${prop(10)} clear=${prop()} count=${state((d) => d.value)}>
  <button @click=${(d) => d.count++}>👍</button>
  <button @click=${(d) => d.clear()}>🗑️</button>
  <span style="margin-left: 0.25em;">
    ${(d) => d.count}
  </span>
</fragment>`;

export function counters() {
  return html`<fragment components=${{counter}} init=${state(2)}>
    <button @click=${(d) => (d.init = 0)} style="margin-bottom: 0.5em">Clear</button>
    <span>${(d) => d.init}</span>
    <br />
    <counter value=${(d) => d.init} @clear=${(d) => (d.init = 0)}></counter>
    <counter value=${(d) => d.init + 1} @clear=${(d) => (d.init = 0)}></counter>
    <counter></counter>
  </fragment>`;
}
