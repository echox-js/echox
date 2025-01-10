let actives, disposes, updates;

const GC_CYCLE = 1000;

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

const isWatchable = (d) => Array.isArray(d) || (d && d.constructor === Object);

const isMountable = (d) => d || d === 0;

const observe = (d) => ((d.__observe__ = true), d);

class Reactive {
  constructor() {
    this._defs = {};
    this.__states__ = {}; // For testing.
  }
  let(k, v) {
    this._defs[k] = v;
    return this;
  }
  join() {
    const create = (v) => ({val: watch(v)[0], deps: new Set()});
    const [scope, states] = watch({...this._defs});

    this.__states__ = states; // For testing.

    function watch(obj) {
      // Only watch arrays and objects.
      if (!isWatchable(obj)) return [obj];

      // Can't use Object.entries because it doesn't work with arrays.
      // Can't use Object.keys because it doesn't get the length of the array.
      const states = Object.fromEntries(Object.getOwnPropertyNames(obj).map((k) => [k, create(obj[k])]));

      const isArray = Array.isArray(obj);
      const scope = new Proxy(obj, {
        get: (_, k) => {
          // Can't use `key in states` because array and object will share the same keys,
          // such constructor, prototype, etc.
          if (!Object.hasOwn(states, k)) return obj[k];
          const state = states[k];
          actives?.getters?.add(state);
          return state.val;
        },
        set: (target, k, v) => {
          if (!Object.hasOwn(states, k)) {
            // Array may add more keys when the length has changed,
            // such as array.push, make sure to track the new keys.
            // This works because `array.push` will set the length,
            // and trigger flush, which will retrack the new keys.
            // This will not work with regular objects, so it can't
            // automatically track new keys.
            if (isArray && Number.isInteger(+k)) states[k] = create(v);

            // !!!Can't add else here, I'm not sure why...
            return (target[k] = v), true;
          }

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

      return [scope, states];
    }

    return [scope];
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

const attr = (callback, setter) => track(() => setter(callback()));

const child = (callback, dom) => {
  // Use a guard node to remember the position to insert new nodes.
  const guard = new Text("");
  dom.append(guard);

  let prevNodes;

  return track(() => {
    if (prevNodes) prevNodes.forEach((node) => node.remove());
    const nodes = [callback()].flat().filter(isMountable);
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const node = n?.nodeType ? n : new Text(n);
      nodes[i] = node;
      dom.insertBefore(node, guard);
    }
    prevNodes = nodes;
    return guard;
  });
};

export const $ = (callback) =>
  observe((context) => {
    if (typeof context === "function") return attr(callback, context);
    return child(callback, context);
  });

export const reactive = () => new Reactive();
