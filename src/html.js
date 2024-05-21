import {TYPE_ELEMENT, TYPE_TEXT, DATA_STATE, TYPE_ROOT, TYPE_FOR} from "./constants.js";
import {Attribute} from "./attribute.js";

const active = new Set();
let flushing = false;

function isNode(d) {
  return d instanceof Node;
}

function isString(d) {
  return typeof d === "string";
}

function isFunction(d) {
  return typeof d === "function";
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

function bind(f, ref) {
  ref.effects.push(f), f(), ref.effects.pop();
}

function flush(state) {
  active.add(state);
  if (flushing) return;
  flushing = true;
  requestAnimationFrame(() => {
    active.forEach((state) => state.effects.forEach((f) => f()));
    active.clear(), (flushing = false);
  });
}

function observe(target, descriptors, ref) {
  const states = new Map(descriptors[DATA_STATE]);
  return new Proxy(target, {
    get(target, key) {
      if (!states.has(key)) return Reflect.get(target, key);
      const state = states.get(key);
      if (isFunction(state.val) && !state.rawVal) {
        state.rawVal = state.val;
        bind(() => (ref.data[key] = state.rawVal(ref.data)), ref);
      }
      const effect = ref.effects[ref.effects.length - 1];
      if (effect) state.effects.add(effect);
      return state.val;
    },
    set(target, key, value) {
      if (!states.has(key)) return Reflect.set(target, key, value);
      const state = states.get(key);
      if (state.val !== value) (state.val = value), flush(state);
      return true;
    },
  });
}

function renderHtml(string) {
  const template = document.createElement("template");
  template.innerHTML = string;
  return document.importNode(template.content, true);
}

function hydrate(root, ref, args) {
  const removeNodes = [];
  const walker = document.createTreeWalker(root);

  while (root) {
    const node = walker.currentNode;
    const nodeType =
      !node.parentElement && node.nodeName === "FRAGMENT"
        ? TYPE_ROOT
        : node.nodeName === "FOR"
        ? TYPE_FOR
        : node.nodeType;

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
        ref.data = observe({}, descriptors, ref);
        removeAttributes.forEach((name) => node.removeAttribute(name));
        break;
      }
      case TYPE_FOR: {
        walker.nextSibling();
        const each = node.attributes["each"].value;
        let value;
        if (/::\d+/.test(each) && isFunction((value = args[+each.slice(2)]))) {
          const array = value(ref.data);
          const children = [...node.children];
          for (let i = 0, n = array.length; i < n; i++) {
            const item = array[i];
            ref.data.$item = item;
            ref.data.$index = i;
            ref.data.$array = array;
            for (let j = 0, m = children.length; j < m; j++) {
              const child = children[j];
              const clone = child.cloneNode(true);
              hydrate(clone, ref, args);
              node.appendChild(clone);
            }
          }
          children.forEach((d) => d.remove());
          node.removeAttribute("each");
        }
        walker.previousNode();
        break;
      }
      case TYPE_ELEMENT: {
        const {attributes} = node;
        for (let i = 0, n = attributes.length; i < n; i++) {
          const {name, value: currentValue} = attributes[i];
          if (/::\d+/.test(currentValue)) {
            if (name.startsWith("@")) {
              const value = args[+currentValue.slice(2)];
              node.addEventListener(name.slice(1), (...params) => value(ref.data, ...params));
              node.removeAttribute(name);
            } else {
              const values = valuesof(currentValue, args);
              if (values.every(isString)) node.setAttribute(name, values.join(""));
              else {
                bind(() => {
                  const string = values.map((d) => (isFunction(d) ? d(ref.data) : d)).join("");
                  node.setAttribute(name, string);
                }, ref);
              }
            }
          }
        }
        break;
      }
      case TYPE_TEXT: {
        const {textContent: rawContent} = node;
        const textContent = rawContent.trim();
        if (/::\d+/.test(textContent)) {
          const parent = node.parentNode;
          const values = valuesof(textContent, args);
          for (let i = 0, n = values.length; i < n; i++) {
            const value = values[i];
            if (!isFunction(value)) {
              const n = nodeof(value);
              parent.insertBefore(n, node);
            } else {
              const actualParent = parent.insertBefore(document.createElement("fragment"), node);
              bind(() => {
                actualParent.innerHTML = "";
                const fragments = value(ref.data);
                const values = Array.isArray(fragments) ? fragments : [fragments];
                actualParent.append(...values.map(nodeof));
              }, ref);
            }
          }
          removeNodes.push(node);
        }
        break;
      }
    }

    root = walker.nextNode();
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
  const ref = {data: null, effects: []};
  hydrate(root, ref, arguments);
  return root;
}
