import {isExpr, isControl, isNode, isFunc, isStr, assign, from} from "./shared.js";
import {ref, setRef} from "./ref.js";
import {track} from "./reactive.js";
import {node} from "./html.js";
import {dispose, remove, UNMOUNT} from "./unmount.js";

const cache = {};

const placeholder = () => document.createTextNode("");

const setterOf = (p, k) => p && (Object.getOwnPropertyDescriptor(p, k) ?? setterOf(Object.getPrototypeOf(p), k));

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

export const fragment = (d, parent) => d.children.forEach((child) => mount(parent, child));

export const patch = (parent) => {
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
};

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
      return text;
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
