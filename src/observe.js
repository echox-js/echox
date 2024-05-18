import {DATA_STATE} from "./constants.js";

export function observe(target, descriptors, global) {
  const states = new Map(descriptors[DATA_STATE]);
  return new Proxy(target, {
    get(target, key) {
      if (states.has(key)) {
        const state = states.get(key);
        if (global.effect) {
          state.effects.push(global.effect);
          global.effect = null;
        }
        return state.val;
      }
      return target[key];
    },
    set(target, key, value) {
      if (states.has(key)) {
        const state = states.get(key);
        state.val = value;
        setTimeout(() => state.effects.forEach((f) => f()));
      } else {
        target[key] = value;
      }
      return true;
    },
  });
}
