import {html, state} from "../../src/index.js";

export function counter() {
  return html`<fragment count=${state(0)}>
    <button @click=${(d) => d.count++}>👍</button>
    <button @click=${(d) => d.count--}>👎</button>
    <span
      style="
        margin-left: 0.25em;
        background:${(d) => {
        const v = 255 - Math.abs(d.count * 10);
        return `rgb(${v}, ${v}, ${v})`;
      }}
      "
    >
      ${(d) => d.count}
    </span>
  </fragment>`;
}
