import {html, component, ref, effect, prop, state} from "../../src/index.js";

export function refs() {
  // TODO: Add support for refs in components.
  const Comp = component`<define ref=${prop()}>
    <div ref="ref"></div>
  </define>`;

  return html`<define
    div=${ref()}
    div2=${ref()}
    comp=${Comp}
    show=${state(true)}
    ${effect((d) => d.div && (d.div.textContent = "hello"))}
    ${effect((d) => d.div2 && (d.div2.textContent = "world"))}
  >
    <button @click=${(d) => (d.show = !d.show)}>Toggle</button>
    <if expr=${(d) => d.show}>
      <div ref="div"></div>
    </if>
  </define>`;
}
