import {maybeCall, symbol, isObject, isArray, entries, from, assign, isExpr, isFunc, isNatural} from "./shared.js";
import {ref, setRef} from "./ref.js";
import {UNMOUNT} from "./unmount.js";

let updates, actives;

const UNSET = symbol();

const scheduleUpdate = (state) => (updates = (updates ?? (setTimeout(flushUpdate), new Set())).add(state));

const flushUpdate = () => {
  while (updates.size) {
    const deps = Array.from(new Set([...updates].flatMap(({deps}) => [...deps])));
    updates = new Set();
    deps.forEach(track);
  }
  updates = null;
};

export const track = (effect) => {
  const prev = actives;
  const cur = (actives = {setters: new Set(), getters: new Set()});
  try {
    effect();
  } catch (e) {
    console.error(e);
  }
  actives = prev;
  for (const d of cur.getters) cur.setters.has(d) || d.deps.add(effect);
};

class Reactive {
  constructor() {
    this._defaults = {children: () => []};
    this._states = {};
    this._effects = {};
    this._scopes = {};
  }
  get(k, v) {
    this._defaults[k] = v;
    return this;
  }
  let(k, v) {
    this._states[k] = v;
    return this;
  }
  use(k, v) {
    this._scopes[k] = v;
    return this;
  }
  call(v) {
    this._effects[symbol()] = v;
    return this;
  }
  join(props) {
    const {_defaults, _states, _effects, _scopes} = this;
    const defaults = from(_defaults, maybeCall);
    const scope = watch({..._states, ..._effects}, 0);
    const keys = Object.getOwnPropertySymbols(_effects);
    const disposes = [];
    for (const [k, v] of entries(_scopes)) scope[k] = v(scope);
    for (let i = 0; i < keys.length; i++) track(() => (maybeCall(disposes[i]), (disposes[i] = scope[keys[i]](scope))));
    return assign(scope, {
      [UNMOUNT]: () => {
        for (const [k] of entries(_scopes)) maybeCall(scope[k][UNMOUNT]);
        disposes.forEach(maybeCall);
      },
    });

    function watch(obj, depth) {
      if (!isObject(obj)) return obj;
      const top = depth === 0;
      const state = (v) => ({raw: v, deps: new Set(), val: UNSET});
      const states = from(obj, state);
      if (isArray(obj)) states.length = state(obj.length);
      const scope = new Proxy(obj, {
        get(target, key) {
          if (top) {
            const prop = props?.[key] ?? defaults[key];
            if (key in defaults) return isExpr(prop) ? prop() : prop;
          }
          const s = states[key];
          if (!s) return target[key];
          if (s.val === UNSET) {
            if (top && isFunc(s.raw)) track(() => (scope[key] = watch(s.raw(scope), depth + 1)));
            else s.val = watch(s.raw, depth + 1);
          }
          actives?.getters?.add(s);
          return s.val;
        },
        set(target, key, value) {
          if (top && key === ref) return props[setRef](value), true;
          if (!(key in states)) {
            if (isArray(target) && isNatural(+key)) states[key] = state(target[key]);
            else return (target[key] = value), true;
          }
          const s = states[key];
          actives?.setters?.add(s);
          if (value === state.val) return true;
          s.val = value;
          if (s.deps.size) scheduleUpdate(s);
          return true;
        },
      });
      return scope;
    }
  }
}

export const reactive = () => new Reactive();
