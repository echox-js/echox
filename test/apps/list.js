import {html, state} from "../../src/index.js";

export function list() {
  return html`<define items=${state([{message: "Foo"}, {message: "Bar"}])}>
    <ul>
      ${(d) => d.items.map((item) => html`<li>${item.message}</li>`)}
    </ul>
  </define>`;
}
