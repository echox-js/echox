import {html, method, state, store, component} from "../../src/index.js";

const count = store`<define 
  value=${state(0)} 
  increment=${method((d) => d.value++)} 
  decrement=${method((d) => d.value--)}>
</define>`;

export function counter3() {
  const Show = component`<define count=${count()}><span>${(d) => d.count.value}</span><define>`;
  const Add = component`<define count=${count()}><button @click=${(d) => d.count.increment()}>👍</button><define>`;
  const Sub = component`<define count=${count()}><button @click=${(d) => d.count.decrement()}>👎</button><define>`;

  return html`<define show=${Show} add=${Add} sub=${Sub}>
    <show></show>
    <add></add>
    <sub></sub>
  </define>`;
}
