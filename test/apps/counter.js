import {html, state} from "../../src/index.js";

export function counter() {
  return html`<fragment value=${state(0)}>
    <button onclick=${(d) => d.value++}>👍</button>
    <button onclick=${(d) => d.value--}>👎</button>
    <span
      style=${(d) => {
        const v = 255 - Math.abs(d.value * 10);
        return `background: rgb(${v}, ${v}, ${v})`;
      }}
      >${(d) => d.value}</span
    >
  </fragment>`;
}
