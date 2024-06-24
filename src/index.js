const protoOf = Object.getPrototypeOf;
const strProto = protoOf("");
const funcProto = protoOf(protoOf);
const isStr = (d) => protoOf(d) === strProto;
const isFunc = (d) => protoOf(d) === funcProto && !d.tag;
const cache = {};

export function reactive() {
  const defaults = {};
  let props, pctx;
  const states = {};
  const ctx = new Proxy(Object.create(null), {
    get: (t, k) => {
      const prop = props?.[k] ?? defaults[k];
      if (k in defaults) return isFunc(prop) ? prop(pctx) : prop;
      if (k in states) return states[k];
      return t[k];
    },
  });
  const _ = (p, c) => (((props = p), (pctx = c)), ctx);
  return Object.assign(_, {
    prop: (k, v) => ((defaults[k] = v?.()), _),
    state: (k, v) => ((states[k] = v()), _),
  });
}

const setterOf = (proto, k) => proto && (Object.getOwnPropertyDescriptor(proto, k) ?? setterOf(protoOf(proto), k));

function render(node, ctx = {}) {
  if (isStr(node)) return [document.createTextNode(node)];
  if (isFunc(node)) return [document.createTextNode(node(ctx))];
  const {tag, ns, props = {}, children = []} = node;
  if (!isStr(tag)) return render(tag[1], tag[0](props, ctx));
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
  for (const child of children) el.append(...render(child, ctx));
  return [el];
}

const node = (tag, ns) => (props, _) => Object.assign((_ = (...c) => ((_.children = c), _)), {props, tag, ns});

const handler = (ns) => ({get: (_, tag) => node(tag, ns)});

export const X = new Proxy((ns) => new Proxy({}, handler(ns)), handler());

export const component = (...params) => node(params[1] ? params : [reactive(), params[0]]);

export const mount = (el, node) => el.append(...render(node));

export default {X, component, mount, reactive};
