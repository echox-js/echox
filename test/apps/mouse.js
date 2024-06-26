import {html, state, method, composable, effect} from "../../src/index.js";

const useMouse = composable`<define 
  x=${state(0)} 
  y=${state(0)}
  log=${method((d) => console.log(d.x, d.y))} 
  ${effect((d) => {
    const update = ({clientY, clientX}) => ((d.x = clientX), (d.y = clientY));
    window.addEventListener("mousemove", update);
    return () => (window.removeEventListener("mousemove", update), console.log("remove"));
  })}>
</define>`;

export function mouse() {
  return html`<define mouse=${useMouse}>
    <button @click=${(d) => d.mouse.log()}>Log</button>
    <span>${(d) => `(${d.mouse.x}, ${d.mouse.y})`}</span>
  </define>`;
}
