import {html, state, component} from "../../src/index.js";

export function names() {
  return html`<define reversed-word=${state("olleh")} my-component=${component`<span>My Component</span>`}>
    <span>${(d) => d.reversedWord}</span>
    <my-component></my-component>
  </define>`;
}
