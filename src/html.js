import {TYPE_ELEMENT, TYPE_TEXT, DATA_STATE, TYPE_ROOT} from "./constants.js";
import {Attribute} from "./attribute.js";

let active = new Set();
let queue = new Set();
let flushing = false;

function isNode(d) {
  return d instanceof Node;
}

function isString(d) {
  return typeof d === "string";
}

function valuesof(string, args) {
  return string
    .split(/(::\d+)/)
    .filter((d) => d !== "" && d !== " ")
    .map((value) => (/^::\d+$/.test(value) ? args[+value.slice(2)] : value));
}

function nodeof(value) {
  return isNode(value) ? value : document.createTextNode(value);
}

function bind(f, global) {
  (global.effect = f), f(), (global.effect = null);
}

function flush() {
  if (flushing) return;
  flushing = true;
  requestAnimationFrame(() => {
    queue.forEach((effect) => effect());
    (active = new Set()), (queue = new Set()), (flushing = false);
  });
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

function postprocess(fragment) {
  if (fragment.firstChild === null) return null;
  if (fragment.firstChild === fragment.lastChild) return fragment.removeChild(fragment.firstChild);
  const span = document.createElement("span");
  span.appendChild(fragment);
  return span;
}

function renderHtml(string) {
  const template = document.createElement("template");
  template.innerHTML = string;
  return document.importNode(template.content, true);
}

function hydrate(root, args) {
  let data;
  const global = {effect: null};
  const walker = document.createTreeWalker(root);
  const removeNodes = [];

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
          if (/^::/.test(currentValue) && (value = args[+currentValue.slice(2)]) instanceof Attribute) {
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
              const value = args[+currentValue.slice(2)];
              node.addEventListener(name.slice(1), (...params) => value(data, ...params));
              node.removeAttribute(name);
            } else {
              const values = valuesof(currentValue, args);
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
          const parent = node.parentNode;
          const values = valuesof(textContent, args);
          for (let i = 0, n = values.length; i < n; i++) {
            const value = values[i];
            if (typeof value !== "function") {
              const n = nodeof(value);
              parent.insertBefore(n, node);
            } else {
              const actualParent = n === 1 ? parent : parent.insertBefore(document.createElement("span"));
              bind(() => {
                actualParent.innerHTML = "";
                const fragments = value(data);
                const values = Array.isArray(fragments) ? fragments : [fragments];
                actualParent.append(...values.map(nodeof));
              }, global);
            }
          }
          removeNodes.push(node);
        }
        break;
      }
    }
  }
  removeNodes.forEach((node) => node.remove());
}

export function html({raw: strings}) {
  let string = "";
  for (let j = 0, m = arguments.length; j < m; j++) {
    const input = strings[j];
    if (j > 0) string += "::" + j;
    string += input;
  }
  const root = renderHtml(string);
  hydrate(root, arguments);
  return postprocess(root);
}
