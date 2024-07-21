const assign = Object.assign;
const entries = Object.entries;
const symbol = Symbol;
const isStr = (d) => typeof d === "string";
const isFunc = (d) => typeof d === "function";
const isExpr = (d) => isFunc(d) && !d.tag && !d.cf;
const isNode = (d) => isFunc(d) && d.tag;
const isControl = (d) => isFunc(d) && d.cf;
const isDef = (d) => d !== undefined;
const isObject = (d) => d instanceof Object && !(d instanceof Function);
const isArray = Array.isArray;
const isPositiveInt = (d) => Number.isInteger(d) && d >= 0;
const cache = {};
const UNSET = symbol();
const UNMOUNT = symbol();
const setRef = symbol();
export const ref = symbol();

const placeholder = () => document.createTextNode("");

const from = (obj, callback) => Object.fromEntries(entries(obj).map(([k, v]) => [k, callback(v, k)]));

const maybeCall = (d) => (isFunc(d) ? d() : d);

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

function dispose(node) {
  const disposes = [];
  const collect = (node) => {
    node.childNodes.forEach(collect);
    if (node[UNMOUNT]) disposes.push(node[UNMOUNT]);
  };
  collect(node);
  disposes.forEach(maybeCall);
}

function remove(node) {
  node.remove(), dispose(node);
}

function patch(parent) {
  let prevNodes;
  const guard = placeholder();
  return (nodes) => {
    nodes.push(guard);
    if (!prevNodes) return parent.append(...(prevNodes = nodes));
    prevNodes = prevNodes.filter((d) => d.isConnected);
    const n = prevNodes.length;
    const m = nodes.length;
    const tempByElement = new Map();
    const removed = new Set();
    for (let i = 0; i < Math.max(m, n); i++) {
      let prev = prevNodes[i];
      if (tempByElement.has(prev)) prev = tempByElement.get(prev);
      const cur = nodes[i];
      const last = nodes[i - 1];
      if (i >= m) remove(prev);
      else if (i >= n) parent.insertBefore(cur, last?.nextSibling);
      else if (prev !== cur) {
        removed.delete(cur);
        const temp = placeholder();
        cur.replaceWith(temp), tempByElement.set(cur, temp);
        prev.replaceWith(cur);
        removed.add(prev);
      }
    }
    removed.forEach(dispose);
    prevNodes = nodes;
  };
}

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
            if (isArray(target) && isPositiveInt(+key)) states[key] = state(target[key]);
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
  newProps[ref] = props[ref];
  newProps[setRef] = (val) => (scope[props[ref]] = val);
  return node(tag, ns)(newProps)(...children.map((d) => hydrate(d, scope)));
};

const fragment = (d, parent) => d.children.forEach((child) => mount(parent, child));

const handler = (ns) => ({get: (_, tag) => node(tag, ns)});

function kebabCase(string) {
  return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
}

export const cx = (...names) =>
  names
    .flatMap((d) =>
      isObject(d)
        ? entries(d)
            .filter(([, v]) => v)
            .map(([k]) => k)
        : d,
    )
    .filter((d) => isStr(d) && !!d)
    .join(" ");

export const css = (...styles) =>
  styles
    .reverse()
    .filter(isObject)
    .flatMap(entries)
    .map(([k, v]) => `${kebabCase(k)}: ${v}`)
    .join(";");

export const method =
  (fn) =>
  (d) =>
  (...params) =>
    fn(d, ...params);

export const html = new Proxy((ns) => new Proxy({}, handler(ns)), handler());

export const component = (...params) => node(params[1] ? params : [reactive(), params[0]]);

export const controlFlow = (...params) => {
  const [join, template] = params[1] ? params : [reactive(), params[0]];
  return component(join, assign(template, {cf: true}));
};

export const Fragment = controlFlow(fragment);

export const Slot = controlFlow(
  reactive().get("from", (d) => () => d.children),
  (d, parent) => {
    const fromNodes = [d.from].flat(Infinity);
    (fromNodes.length ? fromNodes : d.children).forEach((child) => mount(parent, child));
  },
);

export const Match = controlFlow(reactive().get("test").get("value"), (d, parent) => {
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

export const Arm = controlFlow(reactive().get("test"), assign(fragment, {arm: true}));

export const For = controlFlow(reactive().get("each"), (d, parent) => {
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
      nodes.forEach(remove);
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
        .let("val", () => datum)
        .let("index", () => i)
        .join();
      d.children.forEach((child) => mount(el, child, scope));
      scopeByDatum.set(datum, scope);
      newNodes[i] = [...el.childNodes];
    }

    replace((prevNodes = newNodes).flat(Infinity));
  });
});

export const unmount = (node) => (dispose(node), (node.innerHTML = ""));

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
    const subscope = tag[0].join(assign(props, {children}));
    mount(parent, tag[1], subscope);
    let last = parent;
    while (last.nodeType === 11) last = last.lastChild;
    const unmount = last[UNMOUNT];
    last[UNMOUNT] = () => (unmount?.(), subscope?.[UNMOUNT]?.());
    return;
  }
  const {tag, ns, props, children} = node;
  const el = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
  parent.append(el);
  if (props[ref]) scope[props[ref]] = el;
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
