import * as X from "echox";

export function expression() {
  return X.html`<define text=${X.state("hello world")}>
    <span>${(d) => d.text}</span>
  </define>`;
}
