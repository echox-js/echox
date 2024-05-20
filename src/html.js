import {TYPE_ELEMENT, TYPE_TEXT, DATA_STATE, TYPE_ROOT} from "./constants.js";
import {Attribute} from "./attribute.js";

let active = new Set();
let queue = new Set();
let flushing = false;

function flush() {
  if (flushing) return;
  flushing = true;
  requestAnimationFrame(() => {
    queue.forEach((effect) => effect());
    active = new Set();
    queue = new Set();
    flushing = false;
  });
}

function renderHtml(string) {
  const template = document.createElement("template");
  template.innerHTML = string;
  return document.importNode(template.content, true);
}

function postprocess(fragment) {
  if (fragment.firstChild === null) return null;
  if (fragment.firstChild === fragment.lastChild) return fragment.removeChild(fragment.firstChild);
  const span = document.createElement("span");
  span.appendChild(fragment);
  return span;
}

function bind(f, global) {
  global.effect = f;
  return f();
}

function isNode(d) {
  return d instanceof Node;
}

function isString(d) {
  return typeof d === "string";
}

function observe(target, descriptors, global) {
  const states = new Map(descriptors[DATA_STATE]);

  return new Proxy(target, {
    get(target, key) {
      if (!states.has(key)) return target[key];
      const state = states.get(key);
      const effect = global.effect;
      if (effect) state.effects.add(effect);
      return state.val;
    },
    set(target, key, value) {
      if (!states.has(key)) return (target[key] = value), true;
      const state = states.get(key);
      if (state.val !== value && !active.has(state)) {
        queue = queue.union(state.effects);
        active.add(state);
        flush();
      }
      state.val = value;
      return true;
    },
  });
}

export function html({raw: strings}) {
  let string = "";
  for (let j = 0, m = arguments.length; j < m; j++) {
    const input = strings[j];
    if (j > 0) string += "::" + j;
    string += input;
  }

  let data;
  const global = {effect: null};
  const root = renderHtml(string);
  const walker = document.createTreeWalker(root);
  const removeNodes = [];
  const valuesof = (string) =>
    string
      .split(/(::\d+)/)
      .filter((d) => d !== "" && d !== " ")
      .map((value) => (/^::\d+$/.test(value) ? arguments[+value.slice(2)] : value))
      .flat(Infinity);

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeType = !node.parentElement && node.nodeName === "FRAGMENT" ? TYPE_ROOT : node.nodeType;
    switch (nodeType) {
      case TYPE_ROOT: {
        const {attributes} = node;
        const descriptors = {[DATA_STATE]: []};
        const removeAttributes = [];
        for (let i = 0, n = attributes.length, value; i < n; i++) {
          const {name, value: currentValue} = attributes[i];
          if (/^::/.test(currentValue) && (value = arguments[+currentValue.slice(2)]) instanceof Attribute) {
            const {t, v} = value;
            descriptors[t].push([name, {val: v, effects: new Set()}]);
            removeAttributes.push(name);
          }
        }
        data = observe({}, descriptors, global);
        removeAttributes.forEach((name) => node.removeAttribute(name));
        break;
      }
      case TYPE_ELEMENT: {
        const {attributes} = node;
        for (let i = 0, n = attributes.length; i < n; i++) {
          const {name, value: currentValue} = attributes[i];
          if (/::\d+/.test(currentValue)) {
            if (name.startsWith("@")) {
              const value = arguments[+currentValue.slice(2)];
              node.addEventListener(name.slice(1), (...params) => value(data, ...params));
              node.removeAttribute(name);
            } else {
              const values = valuesof(currentValue);
              if (values.every(isString)) node.setAttribute(name, values.join(""));
              else bind(() => node.setAttribute(name, values.map((d) => (isString(d) ? d : d(data))).join("")), global);
            }
          }
        }
        break;
      }
      case TYPE_TEXT: {
        const {textContent: rawContent} = node;
        const textContent = rawContent.trim();
        if (/^::/.test(textContent)) {
          const nodeof = (node) => (isNode(node) ? node : document.createTextNode(node));
          const updateLastNodeRef = (ref, node) => ref && ((ref.current = node), (node.__ref__ = ref));
          const parent = node.parentNode;
          const values = valuesof(textContent);

          for (let i = 0, n = values.length, prevLastNodeRef; i < n; i++) {
            const value = values[i];
            if (typeof value !== "function") {
              const n = nodeof(value);
              parent.insertBefore(n, node);
              updateLastNodeRef(prevLastNodeRef, n);
            } else {
              const firstNodeRef = {current: null}; // Inclusive
              const lastNodeRef = {current: node}; // Exclusive
              const prevRef = {current: prevLastNodeRef};
              bind(() => {
                const fragments = value(data);
                const values = Array.isArray(fragments) ? fragments : [fragments];
                const newNodes = values.map(nodeof);
                const lastNode = lastNodeRef.current.parentElement ? lastNodeRef.current : null;
                const m = newNodes.length;
                let oldNode = firstNodeRef.current;
                for (let i = 0; i < m; i++) {
                  const newNode = newNodes[i];
                  if (oldNode === null) parent.insertBefore(newNode, lastNode);
                  else {
                    // TODO: Apply mutations instead of replacing the node.
                    parent.replaceChild(newNode, oldNode);
                    if (i === 0 && oldNode.__ref__) oldNode.__ref__.current = newNode;
                    oldNode = newNode.nextSibling;
                  }
                }
                while (oldNode && oldNode !== lastNode) {
                  const next = oldNode.nextSibling;
                  oldNode.remove();
                  oldNode = next;
                }
                firstNodeRef.current = newNodes[0] ?? null;
                updateLastNodeRef(prevRef.current, firstNodeRef.current);
              }, global);
              prevLastNodeRef = lastNodeRef;
            }
          }

          removeNodes.push(node);
        }
        break;
      }
    }
  }

  removeNodes.forEach((node) => node.remove());

  return postprocess(root);
}
