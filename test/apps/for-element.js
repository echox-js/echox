import {html, state} from "../../src/index.js";

export function forElement() {
  return html`<define dark=${state(false)} blocks=${state([1, 2, 3])}>
    <button @click=${(d) => (d.dark = !d.dark)}>Toggle</button>
    <span>${(d) => (d.dark ? "Dark" : "Light")}</span>
    <for each=${(d) => d.blocks}>
      <div
        style="
          width:50px; 
          height:50px;
          margin:10px;
          background: ${(d) => (d.dark ? "#000" : "lightgray")};
          color: ${(d) => (d.dark ? "white" : "black")};
        "
      >
        ${(d) => d.$item}
      </div>
    </for>
  </define>`;
}
