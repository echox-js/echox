import {html, state} from "../../src/index.js";

export function blocks() {
  return html`<fragment dark=${state(false)} blocks=${state([1, 2, 3])}>
    <button @click=${(d) => (d.dark = !d.dark)}>Toggle</button>
    <span>${(d) => (d.dark ? "Dark" : "Light")}</span>
    ${(d) =>
      d.blocks.map(
        (block) => html`<div
          style="
            width:50px; 
            height:50px;
            margin:10px;
            background: ${d.dark ? "#000" : "lightgray"};
            color: ${d.dark ? "white" : "black"};
          "
        >
          ${block}
        </div>`
      )}
  </fragment>`;
}
