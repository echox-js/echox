// Inspired by https://github.com/vanjs-org/van/blob/main/src/van.js

let actives, disposes, updates;

const GC_CYCLE = 1000;

const UNSET = Symbol("UNSET");

const propSetterCache = {};

const protoOf = Object.getPrototypeOf;

const isFunction = (d) => typeof d === "function";

const isStrictObject = (d) => d && protoOf(d) === protoOf({});

const isMountable = (d) => d || d === 0;

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

    for (const effect of this._effects) {
      track(() => {
        const dispose = effect(scope);
        isFunction(dispose) && this._disposes.push(dispose);
      });
    }

    const dispose = () => this._disposes.forEach((d) => d());

    return [scope, dispose];
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

const create = (ns, name, a, b) => {
  const dom = ns ? document.createElementNS(ns, name) : document.createElement(name);
  set(dom, a, b);
  return dom;
};

const handler = (ns) => ({get: (_, name) => create.bind(undefined, ns, name)});

// TODO: test
export function set(dom, a, b) {
  const [props, children] = isStrictObject(a) ? [a, b ?? []] : [{}, a ?? []];
  const name = dom.tagName.toLowerCase();

  for (const [k, v] of Object.entries(props)) {
    // This is for some attributes like innerHTML, textContent, etc.
    const getPropDescriptor = (proto) =>
      proto ? (Object.getOwnPropertyDescriptor(proto, k) ?? getPropDescriptor(protoOf(proto))) : undefined;
    const cacheKey = name + "," + k;
    const propSetter = (propSetterCache[cacheKey] ??= getPropDescriptor(protoOf(dom))?.set ?? 0);

    const setter = propSetter ? propSetter.bind(dom) : dom.setAttribute.bind(dom, k);

    if (!isFunction(v)) setter(v);
    else k.startsWith("on") ? dom.addEventListener(k.slice(2), v) : track(() => (setter(v()), dom));
  }

  let prevNodes = null;
  const flatted = children.flat(Infinity);
  for (let i = 0; i < flatted.length; i++) {
    // Use nodes for their virtual parent, to find the next sibling.
    const nodes = [];
    const child = flatted[i];
    if (prevNodes) prevNodes._next = nodes;
    if (isFunction(child)) {
      track(() => {
        // Find the next sibling node.
        let nextNodes = nodes;
        while ((nextNodes = nextNodes._next) && nextNodes.length === 0) {}
        const next = nextNodes?.[0] ?? null;

        // Remove the previous nodes and insert the new nodes in place.
        nodes.forEach((node) => node.remove());
        const newNodes = mount(dom, next, child());
        let i = 0;
        for (; i < newNodes.length; i++) nodes[i] = newNodes[i];
        for (; i < nodes.length; i++) nodes[i] = null; // Clear the rest.
        nodes.length = newNodes.length;

        // TODO: test
        // TODO: track component instead of the first node.
        return newNodes[0]; // Return the first node for tracking.
      });
    } else if (isMountable(child)) {
      nodes.push(child);
      dom.append(child);
    }
    prevNodes = nodes;
  }
}

export const reactive = () => new Reactive();

export const HTML = new Proxy((ns) => new Proxy(create, handler(ns)), handler());
