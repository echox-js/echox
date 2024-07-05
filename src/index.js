const assign = Object.assign;
const entries = Object.entries;
const isStr = (d) => typeof d === "string";
const isFunc = (d) => typeof d === "function";
const isExpr = (d) => isFunc(d) && !d.tag && !d.cf;
const isNode = (d) => isFunc(d) && d.tag;
const isControl = (d) => isFunc(d) && d.cf;
const isDef = (d) => d !== undefined;
const cache = {};
const unset = Symbol();

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

class Reactive {
  constructor() {
    this._defaults = {children: () => []};
    this._states = {};
  }
  prop(k, v) {
    this._defaults[k] = v;
    return this;
  }
  state(k, v) {
    this._states[k] = v;
    return this;
  }
  join(props) {
    const defaults = from(this._defaults, (v) => v?.());
    const states = from(this._states, (v) => ({raw: v, deps: new Set(), val: unset}));
    const scope = new Proxy(
      {},
      {
        get(target, key) {
          const prop = props?.[key] ?? defaults[key];
          if (key in defaults) return isExpr(prop) ? prop() : prop;
          const state = states[key];
          if (!state) return target[key];
          actives?.getters?.add(state);
          if (state.val === unset) track(() => (scope[key] = state.raw(scope)));
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
      },
    );
    return scope;
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

const handler = (ns) => ({get: (_, tag) => node(tag, ns)});

export const X = new Proxy((ns) => new Proxy({}, handler(ns)), handler());

export const component = (...params) => node(params[1] ? params : [reactive(), params[0]]);

export const controlFlow = (...params) => {
  const [join, template] = params[1] ? params : [reactive(), params[0]];
  return component(join, assign(template, {cf: true}));
};

export const Fragment = controlFlow((d, h) => d.children.map((child) => h(child)));

export const Slot = controlFlow(
  reactive().prop("from", (d) => () => d.children),
  (d, h, _) => ((_ = [d.from].flat(Infinity)), _.length ? _ : d.children).map((child) => h(child)),
);

export const Match = controlFlow(reactive().prop("test").prop("value"), (d, h) => {
  if (isDef(d.test)) return h(d.children[+!d.test], {}, 0);
  const test = ({props: {test}}) => (isDef(d.value) ? test === d.value : isFunc(test) && test());
  return d.children.find((c) => c.tag[1]?.arm && (!c.props?.test || test(c)))?.children.map((c) => h(c)) ?? [];
});

export const Arm = controlFlow(
  reactive().prop("test"),
  assign(() => {}, {arm: true}),
);

export const For = controlFlow(
  reactive().prop("each"),
  (d, h) =>
    d.each?.map((val, index) =>
      d.children.map((child) =>
        h(
          child,
          reactive()
            .state("val", () => val)
            .state("index", () => index)
            .join(),
        ),
      ),
    ) ?? [],
);

export const mount = (parent, template, scope) => {
  const node = scope ? hydrate(template, scope) : template;
  if (!node) return;
  if (isControl(node)) node((child, childScope) => mount(parent, child, childScope));
  else if (isExpr(node)) parent.append(document.createTextNode(node()));
  else if (!isFunc(node)) parent.append(document.createTextNode(node));
  else if (!isStr(node.tag)) {
    const {tag, props, children} = node;
    mount(parent, tag[1], tag[0].join(assign(props, {children})));
  } else {
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
  }
};

export default {X, component, mount, reactive, Fragment, Slot, Match, Arm, For};
