import {html, state, effect, component} from "../../src/index.js";

function f(d) {
  return ("0" + d).slice(-2);
}

const Timer = component`<define
  date=${state(new Date())}
  ${effect(() => console.log(`I'm a new time component.`))}
  ${effect((d) => console.log(+d.date))}
  ${effect((d) => {
    const timer = setInterval(() => (d.date = new Date()), 1000);
    return () => (clearInterval(timer), console.log("Clear timer"));
  })}
  >
  <span>${({date}) => `${f(date.getHours())}:${f(date.getMinutes())}:${f(date.getSeconds())}`}</span>
</define>`;

export function timer() {
  return html`<define components=${{Timer}} show=${state(true)}>
    <button @click=${(d) => (d.show = !d.show)}>Toggle</button>
    <if expr=${(d) => d.show}>
      <timer></timer>
    </if>
  </define>`;
}
