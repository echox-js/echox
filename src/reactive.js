let actives, disposes, updates;

const GC_CYCLE = 1000;

const disconnect = (state) => (state.deps = new Set([...state.deps].filter((d) => d.__dom__?.isConnected)));

const flush = () => {
  while (updates.size) {
    const deps = new Set([...updates].flatMap((s) => [...disconnect(s)])); // Try to clear up dependencies when updating the state.
    updates = new Set();
    deps.forEach(track); // Track the new dependencies caused by conditional branches.
  }
  updates = null;
};

const update = (state) => ((updates = schedule(updates, state, flush)), state);

const dispose = () => {
  for (const d of disposes) disconnect(d);
  disposes = null;
};

const schedule = (set, d, f, ms) => (set ?? (setTimeout(f, ms), new Set())).add(d);

const cleanup = (state) => ((disposes = schedule(disposes, state, dispose, GC_CYCLE)), state);

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
    const states = this.__states__;
    const create = (k) => ({val: this._defs[k], deps: new Set()});
    const scope = new Proxy(
      {},
      {
        get: (_, k) => {
          if (!(k in states)) states[k] = create(k);
          const state = states[k];
          actives?.getters?.add(state);
          return state.val;
        },
        set: (_, k, v) => {
          if (!(k in states)) states[k] = create(k); // Maybe set the value before accessing the state.
          const state = states[k];
          actives?.setters?.add(state); // For circular dependencies.
          if (state.val === v) return true;
          state.val = v;
          if (state.deps.size) update(state);
          return true;
        },
      },
    );
    return [scope];
  }
}

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

export const $ = (callback) => ((callback.__track__ = track), callback);

export const reactive = () => new Reactive();
