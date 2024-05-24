import {html, state, effect, component} from "../../src/index.js";

function f(d) {
  return ("0" + d).slice(-2);
}

const time = component`<fragment
  date=${state(new Date())}
  ${effect(() => console.log(`I'm a new time component.`))}
  ${effect((d) => console.log(+d.date))}
  ${effect((d) => {
    const timer = setInterval(() => (d.date = new Date()), 1000);
    return () => (clearInterval(timer), console.log("Clear timer"));
  })}
  >
  <span>${({date}) => `${f(date.getHours())}:${f(date.getMinutes())}:${f(date.getSeconds())}`}</span>
</fragment>`;

export function timer() {
  return html`<fragment components=${{time}} show=${state(true)}>
    <button @click=${(d) => (d.show = !d.show)}>Toggle</button>
    <if expr=${(d) => d.show}>
      <time></time>
    </if>
  </fragment>`;
}
