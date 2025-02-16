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

const isString = (d) => typeof d === "string";

const isObject = (d) => Object(d) === d;

const isArray = Array.isArray;

const isObservable = (d) => isFunction(d) && "__observe__" in d;

const observe = (d) => ((d.__observe__ = true), d);

const remove = (node) => {
  node.dispose?.();
  node.remove();
};

// Exports for testing.
export class Reactive {
  constructor() {
    this._defs = {};
    this._effects = [];
    this._disposes = [];
    this.__states__ = {}; // For testing.
  }
  state(k, v) {
    this._defs[k] = () => v;
    return this;
  }
  computed(k, f) {
    this._defs[k] = f;
    return this;
  }
  effect(effect) {
    this._effects.push(effect);
    return this;
  }
  join() {
    const create = (val) => ({raw: val, val: UNSET, deps: new Set()});
    const states = Object.fromEntries(Object.entries(this._defs).map(([k, v]) => [k, create(v)]));

    this.__states__ = states; // For testing.

    const builtin = {
      dispose: () => this._disposes.forEach((d) => d()),
      select: (d) => $(isString(d) ? () => scope[d] : isFunction(d) ? () => d(scope) : () => d),
      map: (key, callback) => $(() => scope[key].map(callback)),
      // TODO: Add object.
      update: (key, callback) => {
        const value = scope[key];
        if (isArray(value)) callback(scope[key]), (scope[key] = [...value]);
        scope[key] = value;
      },
    };

    const scope = new Proxy(Object.create(null), {
      get: (target, k) => {
        if (k in builtin) return builtin[k];
        if (!Object.hasOwn(states, k)) return target[k];
        const state = states[k];
        if (state.val === UNSET) track(() => (scope[k] = state.raw(scope)));
        actives?.getters?.add(state);
        return state.val;
      },
      set: (target, k, v) => {
        if (k in builtin) return false;

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

    return scope;
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

// TODO: test memory leak
const attr = (callback, setter) => track(() => setter(callback()));

const child = (callback, dom, prevNodes) => {
  return track(() => {
    // Find the next sibling node.
    let nextNodes = prevNodes;
    while ((nextNodes = nextNodes._next) && nextNodes.length === 0) {}
    const next = nextNodes?.[0] ?? null;

    // Remove the previous nodes and insert the new nodes in place.
    prevNodes.forEach(remove);
    const newNodes = mount(dom, next, callback());
    let i = 0;
    for (; i < newNodes.length; i++) prevNodes[i] = newNodes[i];
    for (; i < prevNodes.length; i++) prevNodes[i] = null; // Clear the rest.
    prevNodes.length = newNodes.length;

    // TODO: test
    // TODO: track component instead of the first node.
    return newNodes[0]; // Return the first node for tracking.
  });
};

const $ = (callback) =>
  observe((context, nodes) => {
    if (!context) return callback(); // For props
    if (typeof context === "function") return attr(callback, context);
    return child(callback, context, nodes);
  });

export function component(define) {
  return (a, b) => {
    const [options, children] = isObject(a) ? [a, b ?? []] : [{}, a ?? []];
    const states = [];

    const reactive = () => {
      const rx = new Reactive();
      const old = rx.join.bind(rx);
      rx.join = () => {
        const state = old();
        states.push(state);
        return state;
      };
      return rx;
    };

    // Convert the options into reactive props.
    const rx = new Reactive();
    for (const [key, value] of Object.entries(options)) rx.state(key, value);
    rx.state("children", children);

    // Update props when options change.
    const props = rx.join();
    for (const [key, value] of Object.entries(options)) {
      if (isObservable(value)) track(() => (props[key] = value()));
    }

    const node = define(props, reactive);
    node.dispose = () => states.forEach((state) => state.dispose?.());

    return node;
  };
}

export const reactive = () => new Reactive();

reactive.prototype = Reactive.prototype;
