import {DATA_STATE} from "./constants.js";
import {Attribute} from "./attribute.js";

export function defineStateAttribute(data, name, initialValue, global) {
  let value = initialValue;
  const effects = [];
  Object.defineProperty(data, name, {
    get() {
      if (global.effect) {
        effects.push(global.effect);
        global.effect = null;
      }
      return value;
    },
    set(newValue) {
      value = newValue;
      setTimeout(() => effects.forEach((f) => f()));
    },
  });
}

export function state(string) {
  return new Attribute(DATA_STATE, string);
}
