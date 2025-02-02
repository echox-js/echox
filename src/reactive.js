// Inspired by https://github.com/vanjs-org/van/blob/main/src/van.js

let actives, disposes, updates;

const GC_CYCLE = 1000;
const UNSET = Symbol("UNSET");

const disconnect = (state) => (state.deps = new Set([...state.deps].filter((d) => d.__dom__?.isConnected)));

const flush = () => {
  while (updates.size) {
    // Try to clear up dependencies when updating the state.
    const deps = new Set([...updates].flatMap((s) => [...disconnect(s)]));
    updates = new Set();

    // Track the new dependencies caused by conditional branches,
    // or new keys in arrays.
    deps.forEach(track);
  }
  updates = null;
};

const update = (state) => ((updates = schedule(updates, state, flush)), state);

const dispose = () => (disposes.forEach(disconnect), (disposes = null));

const schedule = (set, d, f, ms) => (set ?? (setTimeout(f, ms), new Set())).add(d);

const cleanup = (state) => ((disposes = schedule(disposes, state, dispose, GC_CYCLE)), state);

const isMountable = (d) => d || d === 0;

const isFunction = (d) => typeof d === "function";

const observe = (d) => ((d.__observe__ = true), d);

class Reactive {
  constructor() {
    this._defs = {};
    this._effects = [];
    this._disposes = [];
    this.__states__ = {}; // For testing.
  }
  let(k, v) {
    this._defs[k] = () => v;
    return this;
  }
  derive(k, f) {
    this._defs[k] = f;
    return this;
  }
  observe(effect) {
    this._effects.push(effect);
    return this;
  }
  join() {
    const create = (val) => ({raw: val, val: UNSET, deps: new Set()});
    const states = Object.fromEntries(Object.entries(this._defs).map(([k, v]) => [k, create(v)]));

    this.__states__ = states; // For testing.

    const scope = new Proxy(Object.create(null), {
      get: (target, k) => {
        if (!Object.hasOwn(states, k)) return target[k];
        const state = states[k];
        if (state.val === UNSET) track(() => (scope[k] = state.raw(scope)));
        actives?.getters?.add(state);
        return state.val;
      },
      set: (target, k, v) => {
        if (!Object.hasOwn(states, k)) return (target[k] = v), true;
        const state = states[k];

        // For circular dependencies.
        actives?.setters?.add(state);

        // Update the state if the value changes.
        if (state.val === v) return true;
        if (state.deps.size) update(state);
        state.val = v;

        return true;
      },
    });

    // Initialize the scope.
    for (const key in this._defs) scope[key];
    for (const effect of this._effects) {
      track(() => {
        const dispose = effect(scope);
        isFunction(dispose) && this._disposes.push(dispose);
      });
    }

    const dispose = () => this._disposes.forEach((d) => d());

    const use = (d) => $(typeof d === "string" ? () => scope[d] : typeof d === "function" ? d : () => d);

    return [scope, use, dispose];
  }
}

// Exports for testing.
export const track = (effect) => {
  const prev = actives;
  const cur = (actives = {setters: new Set(), getters: new Set()});
  let dom;
  try {
    dom = effect();
  } catch (e) {
    console.error(e);
  }
  actives = prev;
  for (const d of cur.getters)
    cur.setters.has(d) || // Present circular dependencies.
      cleanup(d).deps.add(effect); // Try to clean up dependencies when getting the state.
  effect.__dom__ = dom?.nodeType ? dom : {isConnected: true}; // Only DOM nodes are removable.
};

const mount = (dom, next, value) => {
  const nodes = [value].flat().filter(isMountable);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const node = n?.nodeType ? n : new Text(n);
    nodes[i] = node;
    dom.insertBefore(node, next);
  }
  return nodes;
};

const attr = (callback, setter) => track(() => setter(callback()));

const child = (callback, dom, prevNodes) => {
  return track(() => {
    // Find the next sibling node.
    let nextNodes = prevNodes;
    while ((nextNodes = nextNodes._next) && nextNodes.length === 0) {}
    const next = nextNodes?.[0] ?? null;

    // Remove the previous nodes and insert the new nodes in place.
    prevNodes.forEach((node) => node.remove());
    const newNodes = mount(dom, next, callback());
    let i = 0;
    for (; i < newNodes.length; i++) prevNodes[i] = newNodes[i];
    for (; i < prevNodes.length; i++) prevNodes[i] = null; // Clear the rest.
    prevNodes.length = newNodes.length;
  });
};

const $ = (callback) =>
  observe((context, nodes) => {
    if (typeof context === "function") return attr(callback, context);
    return child(callback, context, nodes);
  });

export const reactive = () => new Reactive();
