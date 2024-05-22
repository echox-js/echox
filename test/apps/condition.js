import {html, state} from "../../src/index.js";

export function condition() {
  return html`<fragment count=${state(0)} dark=${state(false)} background=${state((d) => (d.dark ? "#aaa" : "#fff"))}>
    <button @click=${(d) => (d.dark = !d.dark)}>Toggle</button>
    <button @click=${(d) => d.count++}>👍</button>
    <span>${(d) => d.count}</span>
    <if expr=${(d) => d.count % 3 === 0}>
      <span style="background: ${(d) => d.background}">C</span>
    </if>
    <elif expr=${(d) => d.count % 3 === 1}>
      <span style="background: ${(d) => d.background}">B</span>
    </elif>
    <else>
      <span style="background: ${(d) => d.background}">A</span>
    </else>
  </fragment>`;
}
