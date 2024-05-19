import {html, state} from "../../src/index.js";

export function todolist() {
  return html`<fragment list=${state(["read book"])} input=${state("")}>
    <input placeholder="Add todo" value=${(d) => d.input} oninput=${(d, e) => (d.input = e.target.value)} />
    <button
      onclick=${(d) => {
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
                onclick=${() => {
                  d.list.splice(i, 1);
                  d.list = [...d.list];
                }}
              >
                ❌
              </button>
            </li>`
        )}
    </ul>
  </fragment>`;
}
