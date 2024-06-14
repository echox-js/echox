const cache = {};
const protoOf = Object.getPrototypeOf;
const strProto = protoOf("");
const isStr = (d) => protoOf(d) === strProto;

const setterOf = (proto, k) => proto && (Object.getOwnPropertyDescriptor(proto, k) ?? setterOf(protoOf(proto), k));

function render(node) {
  if (isStr(node)) return [document.createTextNode(node)];
  const {tag, ns, props = {}, children = []} = node;
  if (!isStr(tag)) return render(tag[0]);
  const el = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    const prop = (cache[tag + "," + k] ??= setterOf(el, k)?.set ?? 0).bind?.(el) ?? el.setAttribute.bind(el, k);
    const event = (v) => el.addEventListener(k.slice(1), v);
    (k.startsWith("$") ? event : prop)(v);
  }
  for (const child of children) el.append(...render(child));
  return [el];
}

const node = (tag, ns) => (props, _) => Object.assign((_ = (...c) => ((_.children = c), _)), {props, tag, ns});

const handler = (ns) => ({get: (_, tag) => node(tag, ns)});

export const X = new Proxy((ns) => new Proxy({}, handler(ns)), handler());

export const component = (...args) => node(args);

export const mount = (el, node) => el.append(...render(node));

export default {X, component, mount};
