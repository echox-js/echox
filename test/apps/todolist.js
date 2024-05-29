import {html, state} from "../../src/index.js";

export function todolist() {
  return html`<define list=${state(["read book"])} input=${state("")}>
    <input placeholder="Add todo" value=${(d) => d.input} @input=${(d, e) => (d.input = e.target.value)} />
    <button
      @click=${(d) => {
        d.list.push(d.input);
        d.list = [...d.list];
      }}
    >
      Add
    </button>
    <ul>
      ${(d) =>
        d.list.map(
          (todo, i) =>
            html`<li style="margin-bottom: 0.25em">
              <span style="margin-right: 0.25em">${i}-${todo}</span>
              <button
                @click=${() => {
                  d.list.splice(i, 1);
                  d.list = [...d.list];
                }}
              >
                ❌
              </button>
            </li>`,
        )}
    </ul>
  </define>`;
}
