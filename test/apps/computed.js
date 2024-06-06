import * as X from "echox";

export function computed() {
  return X.html`<div x-message=${X.state("hello")} x-reversed=${X.state((d) => d.message.split("").reverse().join(""))}>
    <input value=${(d) => d.message} $input=${(d, e) => (d.message = e.target.value)} />
    <p>Reversed: ${(d) => d.reversed}</p>
  </div>`;
}
