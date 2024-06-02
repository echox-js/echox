import * as X from "echox";

export function expression() {
  return X.html`<span x-text=${X.state("hello world")}>${(d) => d.text}</span>`;
}
