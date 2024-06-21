const protoOf = Object.getPrototypeOf;
const assign = Object.assign;
const entries = Object.entries;
const strProto = protoOf("");
const funcProto = protoOf(protoOf);
const isStr = (d) => protoOf(d) === strProto;
const isFunc = (d) => protoOf(d) === funcProto && !d.tag;
const isDef = (d) => d !== undefined;
const cache = {};

const from = (obj, callback) => Object.fromEntries(entries(obj).map(([k, v]) => [k, callback(v, k)]));

export function reactive() {
  const _defaults = {children: () => []};
  const _states = {};
  const _ = (props, pctx) => {
    const defaults = from(_defaults, (v) => v?.());
    const states = from(_states, (v) => v());
    return new Proxy(Object.create(null), {
      get: (t, k) => {
        const prop = props?.[k] ?? defaults[k];
        if (k in defaults) return prop && isFunc(prop) ? prop(pctx) : prop;
        if (k in states) return states[k];
        return t[k];
      },
    });
  };
  return assign(_, {
    prop: (k, v) => ((_defaults[k] = v), _),
    state: (k, v) => ((_states[k] = v), _),
  });
}

const setterOf = (proto, k) => proto && (Object.getOwnPropertyDescriptor(proto, k) ?? setterOf(protoOf(proto), k));

function render(node, ctx = {}, bind = true) {
  if (!node) return [];
  if (isStr(node)) return [document.createTextNode(node)];
  if (isFunc(node) && node.cf) return node(ctx, render).flat(Infinity);
  if (isFunc(node)) return [document.createTextNode(node(ctx))];
  if (isStr(node.tag)) {
    const {tag, ns, props, children} = node;
    const el = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      const setter = (cache[tag + "," + k] ??= setterOf(el, k)?.set ?? 0).bind?.(el) ?? el.setAttribute.bind(el, k);
      let old;
      const event = (v) => {
        const name = k.slice(2);
        el.removeEventListener(name, old);
        el.addEventListener(name, (old = v(ctx)));
      };
      const attr = (v) => setter(v(ctx));
      (k.startsWith("on") ? event : isFunc(v) ? attr : setter)(v);
    }
    for (const child of children) el.append(...render(child, ctx, bind));
    return [el];
  }
  const {tag, props, children} = bind ? clone(node, ctx) : node;
  return render(tag[1], tag[0](assign(props, {children}), ctx), bind);
}

const node =
  (tag, ns) =>
  (props = {}) => {
    const create = (...c) => ((create.children = c), create);
    return assign(create, {props, tag, ns, children: []});
  };

const clone = (d, ctx) => {
  const bind =
    (fn) =>
    (...params) =>
      fn(ctx, ...params);
  if (isStr(d)) return d;
  if (isFunc(d)) return bind(d);
  const {tag, ns, props, children} = d;
  const newProps = from(props, (v) => (isFunc(v) ? bind(v) : v));
  return node(tag, ns)(newProps)(...children.map((d) => clone(d, ctx)));
};

const handler = (ns) => ({get: (_, tag) => node(tag, ns)});

export const X = new Proxy((ns) => new Proxy({}, handler(ns)), handler());

export const component = (...params) => node(params[1] ? params : [reactive(), params[0]]);

export const controlFlow = (...params) => {
  const [join, template] = params[1] ? params : [reactive(), params[0]];
  return component(join, assign(template, {cf: true}));
};

export const Fragment = controlFlow((d, h) => d.children.map((child) => h(child, d, 0)));

export const Slot = controlFlow(
  reactive().prop("from", () => (d) => d.children),
  (d, h, _) => ((_ = [d.from].flat(Infinity)), _.length ? _ : d.children).map((child) => h(child, d, 0)),
);

export const Match = controlFlow(reactive().prop("test").prop("value"), (d, h) => {
  if (isDef(d.test)) return h(d.children[+!d.test], {}, 0);
  const test = ({props: {test: _}}) => (isDef(d.value) ? _ === d.value : isFunc(_) && _());
  return d.children.find((c) => c.tag[1]?.arm && (!c.props?.test || test(c)))?.children.map((c) => h(c, d, 0)) ?? [];
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
            .state("index", () => index)(),
        ),
      ),
    ) ?? [],
);

export const mount = (el, node) => el.append(...render(node));

export default {X, component, mount, reactive, Fragment, Slot, Match, Arm, For};
