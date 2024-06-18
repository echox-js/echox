const protoOf = Object.getPrototypeOf;
const strProto = protoOf("");
const funcProto = protoOf(protoOf);
const isStr = (d) => protoOf(d) === strProto;
const isFunc = (d) => protoOf(d) === funcProto && !d.tag;
const unset = Symbol();

const cache = {};
let updates, actives, disposes;

const schedule = (set, state, callback) => (set ?? (setTimeout(callback), new Set())).add(state);

const cleanup = (state) => ((state.effects = new Set([...state.effects].filter((e) => e._el.isConnected))), state);

function scheduleUpdate(state) {
  updates = schedule(updates, state, () => {
    const called = new Set();
    updates.forEach((s) => cleanup(s).effects.forEach((e) => called.has(e) || (called.add(e), track(e, e._el))));
    updates = null;
  });
}

function scheduleCleanup(state) {
  disposes = schedule(disposes, state, () => {
    disposes.forEach((s) => cleanup(s));
    disposes = null;
  });
  return state;
}

function track(effect, el = {isConnected: true}) {
  const prev = actives;
  const cur = (actives = {setters: new Set(), getters: new Set()});
  let newEl;
  try {
    newEl = effect();
  } catch (e) {
    console.error(e);
  }
  effect._el = newEl?.nodeType ? (effect._el?.replaceWith?.(newEl), newEl) : el;
  actives = prev;
  for (const d of cur.getters) cur.setters.has(d) || scheduleCleanup(d).effects.add(effect);
}

export function reactive() {
  const states = {};
  const defaults = {};
  const target = {};
  let parentData, props;
  const data = new Proxy(target, {
    get(target, key) {
      let state, prop;
      if (key in defaults) return (prop = props[key]), (isFunc(prop) ? prop(parentData) : prop) ?? defaults[key];
      if (!(state = states[key])) return target[key];
      actives.getters.add(state);
      if (state.val === unset) track(() => (state.val = state.raw(data)));
      return state.val;
    },
    set(target, key, value) {
      let state;
      if (!(state = states[key])) return (target[key] = value), true;
      actives.setters.add(state);
      if (value === state.val) return true;
      state.val = value;
      if (state.effects.size) scheduleUpdate(state);
      return true;
    },
  });
  const _ = (d, p) => (((parentData = d), (props = p)), data);
  return Object.assign(_, {
    state: (k, v) => ((states[k] = {val: unset, raw: v, effects: new Set()}), _),
    prop: (k, v) => ((defaults[k] = v), _),
  });
}

const setterOf = (proto, k) => proto && (Object.getOwnPropertyDescriptor(proto, k) ?? setterOf(protoOf(proto), k));

function render(node, data = {}) {
  if (isStr(node)) return document.createTextNode(node);
  const {tag, ns, props = {}, children = []} = node;
  if (!isStr(tag)) return render(tag[0], tag[1](data, props));
  const el = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    const prop = (cache[tag + "," + k] ??= setterOf(el, k)?.set ?? 0).bind?.(el) ?? el.setAttribute.bind(el, k);
    const event = (v) => el.addEventListener(k.slice(1), v);
    const state = (v) => track(() => prop(v(data)), el);
    (k.startsWith("$") ? event : isFunc(v) ? state : prop)(v);
  }
  for (let c of children) isFunc(c) ? track(() => render(c(data))) : render(c);
  return el;
}

const node = (tag, ns, _) => (props) => Object.assign((_ = (...c) => ((_.children = c), _)), {props, tag, ns});

const handler = (ns) => ({get: (_, tag) => node(tag, ns)});

export const X = new Proxy((ns) => new Proxy({}, handler(ns)), handler());

export const component = (template, join = reactive()) => node([template, join]);

export const mount = (el, node) => el.appendChild(render(node));

export default {X, mount, component, reactive};
