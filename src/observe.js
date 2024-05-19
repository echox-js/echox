import {DATA_STATE} from "./constants.js";

export function observe(target, descriptors, global) {
  const states = new Map(descriptors[DATA_STATE]);
  return new Proxy(target, {
    get(target, key) {
      if (!states.has(key)) return target[key];
      const state = states.get(key);
      const effect = global.effect;
      if (effect) {
        state.effects.push(effect);
        global.effect = null;
      }
      return state.val;
    },
    set(target, key, value) {
      if (!states.has(key)) return (target[key] = value), true;
      const state = states.get(key);
      state.val = value;
      setTimeout(() => state.effects.forEach((f) => f()));
      return true;
    },
  });
}
