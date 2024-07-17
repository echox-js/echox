const assign = Object.assign;
const entries = Object.entries;
const isStr = (d) => typeof d === "string";
const isFunc = (d) => typeof d === "function";
const isExpr = (d) => isFunc(d) && !d.tag && !d.cf;
const isNode = (d) => isFunc(d) && d.tag;
const isControl = (d) => isFunc(d) && d.cf;
const isDef = (d) => d !== undefined;
const cache = {};
const UNSET = Symbol();

const placeholder = () => document.createTextNode("");

const from = (obj, callback) => Object.fromEntries(entries(obj).map(([k, v]) => [k, callback(v, k)]));

let updates, actives;

function scheduleUpdate(state) {
  updates = (updates ?? (setTimeout(flushUpdate), new Set())).add(state);
}

function flushUpdate() {
  while (updates.size) {
    const deps = Array.from(new Set([...updates].flatMap(({deps}) => [...deps])));
    updates = new Set();
    deps.forEach(track);
  }
  updates = null;
}

function track(effect) {
  const prev = actives;
  const cur = (actives = {setters: new Set(), getters: new Set()});
  try {
    effect();
  } catch (e) {
    console.error(e);
  }
  actives = prev;
  for (const d of cur.getters) cur.setters.has(d) || d.deps.add(effect);
}

function patch(parent) {
  let prevNodes;
  return (nodes) => {
    nodes.push(placeholder());
    if (!prevNodes) return parent.append(...(prevNodes = nodes));
    prevNodes = prevNodes.filter((d) => d.isConnected);
    const n = prevNodes.length;
    const m = nodes.length;
    const tempByElement = new Map();
    for (let i = 0; i < Math.max(m, n); i++) {
      let prev = prevNodes[i];
      if (tempByElement.has(prev)) prev = tempByElement.get(prev);
      const cur = nodes[i];
      const last = nodes[i - 1];
      if (i >= m) prev.remove();
      else if (i >= n) parent.insertBefore(cur, last.nextSibling);
      else if (prev !== cur) {
        const temp = placeholder();
        cur.replaceWith(temp);
        tempByElement.set(cur, temp);
        prev.replaceWith(cur);
      }
    }
    prevNodes = nodes;
  };
}

function compose(...fns) {
  return fns.reduce(
    (f, g) =>
      (...args) =>
        f(g(...args)),
  );
}

function watchProps(reactive) {
  const {_props, _defaults} = reactive;
  const defaults = from(_defaults, (v) => v?.());
  return (target) => {
    return new Proxy(target, {
      get(target, key, proxy) {
        const prop = _props?.[key] ?? defaults[key];
        if (key in defaults) return isExpr(prop) ? prop() : prop;
        return Reflect.get(target, key, proxy);
      },
    });
  };
}

function watchState() {
  return (target) => {
    const states = from(target, (v) => ({raw: v, deps: new Set(), val: UNSET}));
    const scope = new Proxy(target, {
      get(target, key) {
        const state = states[key];
        if (!state) return target[key];
        actives?.getters?.add(state);
        if (state.val === UNSET) track(() => (scope[key] = state.raw(scope)));
        return state.val;
      },
      set(target, key, value) {
        if (!(key in states)) return (target[key] = value), true;
        const state = states[key];
        actives?.setters?.add(state);
        if (value === state.val) return true;
        state.val = value;
        if (state.deps.size) scheduleUpdate(state);
        return true;
      },
    });
    return scope;
  };
}

class Reactive {
  constructor() {
    this._defaults = {children: () => []};
    this._states = {};
    this._props = {};
  }
  prop(k, v) {
    this._defaults[k] = v;
    return this;
  }
  state(k, v) {
    this._states[k] = v;
    return this;
  }
  props(props) {
    this._props = props;
    return this;
  }
  join() {
    const state = watchState(this);
    const prop = watchProps(this);
    const watch = compose(prop, state);
    return watch(this._states);
  }
}

export function reactive() {
  return new Reactive();
}

const setterOf = (p, k) => p && (Object.getOwnPropertyDescriptor(p, k) ?? setterOf(Object.getPrototypeOf(p), k));

const node =
  (tag, ns) =>
  (props = {}) => {
    const create = (...c) => ((create.children = c), create);
    return assign(create, {props, tag, ns, children: []});
  };

const bind =
  (fn, scope) =>
  (...params) =>
    fn(scope, ...params);

const hydrate = (d, scope) => {
  if (isExpr(d)) return bind(d, scope);
  if (isControl(d)) return assign(bind(d, scope), {cf: d.cf});
  if (!isNode(d)) return d;
  const {tag, ns, props, children} = d;
  const newProps = from(props, (v) => (isExpr(v) ? bind(v, scope) : v));
  return node(tag, ns)(newProps)(...children.map((d) => hydrate(d, scope)));
};

const fragment = (d, parent) => d.children.forEach((child) => mount(parent, child));

const handler = (ns) => ({get: (_, tag) => node(tag, ns)});

export const $ = new Proxy((ns) => new Proxy({}, handler(ns)), handler());

export const component = (...params) => node(params[1] ? params : [reactive(), params[0]]);

export const controlFlow = (...params) => {
  const [join, template] = params[1] ? params : [reactive(), params[0]];
  return component(join, assign(template, {cf: true}));
};

export const Fragment = controlFlow(fragment);

export const Slot = controlFlow(
  reactive().prop("from", (d) => () => d.children),
  (d, parent) => {
    const fromNodes = [d.from].flat(Infinity);
    (fromNodes.length ? fromNodes : d.children).forEach((child) => mount(parent, child));
  },
);

export const Match = controlFlow(reactive().prop("test").prop("value"), (d, parent) => {
  const test = ({props: {test}}) => (isDef(d.value) ? test === d.value : isFunc(test) && test());
  const replace = patch(parent);
  let prev;
  track(() => {
    const index = isDef(d.test) ? +!d.test : d.children.findIndex((c) => c.tag[1]?.arm && (!c.props?.test || test(c)));
    if (index !== prev) {
      const root = document.createDocumentFragment();
      mount(root, d.children[index]);
      replace([...root.childNodes]);
    }
    prev = index;
  });
});

export const Arm = controlFlow(reactive().prop("test"), assign(fragment, {arm: true}));

export const For = controlFlow(reactive().prop("each"), (d, parent) => {
  const indexByDatum = new Map();
  const scopeByDatum = new Map();
  let prevNodes = [];
  const replace = patch(parent);
  track(() => {
    const each = d.each ?? [];
    const enter = [];
    const move = [];
    const exit = new Set(indexByDatum.keys());
    const newNodes = [];

    for (let i = 0; i < each.length; i++) {
      const datum = each[i];
      const index = indexByDatum.get(datum);
      exit.delete(datum);
      if (!isDef(index)) enter.push(i);
      else if (index !== i) move.push([index, i]);
      else if (index === i) newNodes[i] = prevNodes[i];
    }

    for (const datum of exit) {
      const index = indexByDatum.get(datum);
      const nodes = prevNodes[index];
      nodes.forEach((node) => node.remove());
      indexByDatum.delete(datum), scopeByDatum.delete(datum);
    }

    for (const [from, to] of move) {
      const datum = each[to];
      const nodes = prevNodes[from];
      const scope = scopeByDatum.get(datum);
      scope.index = to;
      indexByDatum.set(datum, to);
      newNodes[to] = nodes;
    }

    for (const i of enter) {
      const datum = each[i];
      indexByDatum.set(datum, i);
      const el = document.createDocumentFragment();
      const scope = reactive()
        .state("val", () => datum)
        .state("index", () => i)
        .join();
      d.children.forEach((child) => mount(el, child, scope));
      scopeByDatum.set(datum, scope);
      newNodes[i] = [...el.childNodes];
    }

    replace((prevNodes = newNodes).flat(Infinity));
  });
});

export const mount = (parent, template, scope) => {
  const node = scope ? hydrate(template, scope) : template;
  if (!node) return;
  if (isControl(node)) return node(parent);
  if (isExpr(node)) {
    let old;
    return track(() => {
      const text = document.createTextNode(node());
      old?.replaceWith(text) ?? parent.append(text);
      old = text;
    });
  }
  if (!isFunc(node)) return parent.append(document.createTextNode(node));
  if (!isStr(node.tag)) {
    const {tag, props, children} = node;
    return mount(parent, tag[1], tag[0].props(assign(props, {children})).join());
  }
  const {tag, ns, props, children} = node;
  const el = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
  parent.append(el);
  for (const [k, v] of Object.entries(props)) {
    const setter = (cache[tag + "," + k] ??= setterOf(el, k)?.set ?? 0).bind?.(el) ?? el.setAttribute.bind(el, k);
    let old;
    const event = (v) => {
      const name = k.slice(2);
      el.removeEventListener(name, old);
      el.addEventListener(name, (old = v()));
    };
    const attr = (v) => setter(v());
    k.startsWith("on") ? track(() => event(v)) : isExpr(v) ? track(() => attr(v)) : setter(v);
  }
  for (const child of children) mount(el, child);
};
