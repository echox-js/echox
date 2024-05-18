import {TYPE_ELEMENT, TYPE_TEXT, DATA_STATE, TYPE_ROOT} from "./constants.js";
import {Attribute} from "./attribute.js";
import {observe} from "./observe.js";

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
  f();
}

function isNode(node) {
  return node instanceof Node;
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

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeType = !node.parentElement ? TYPE_ROOT : node.nodeType;
    switch (nodeType) {
      case TYPE_ROOT: {
        const {attributes} = node;
        const descriptors = {[DATA_STATE]: []};
        for (let i = 0, n = attributes.length, value; i < n; i++) {
          const {name, value: currentValue} = attributes[i];
          if (/^::/.test(currentValue) && (value = arguments[+currentValue.slice(2)]) instanceof Attribute) {
            if (!node.parentElement && value instanceof Attribute) {
              const {t, v} = value;
              descriptors[t].push([name, {val: v, effects: []}]);
              node.removeAttribute(name);
            }
          }
        }
        data = observe({}, descriptors, global);
        break;
      }
      case TYPE_ELEMENT: {
        const {attributes} = node;
        for (let i = 0, n = attributes.length; i < n; i++) {
          const {name, value: currentValue} = attributes[i];
          if (/^::/.test(currentValue)) {
            const value = arguments[+currentValue.slice(2)];
            if (name.startsWith("on")) {
              node.addEventListener(name.slice(2), (...params) => value(data, ...params));
              node.removeAttribute(name);
            } else {
              if (typeof value !== "function") node.setAttribute(name, value);
              else bind(() => node.setAttribute(name, value(data)), global);
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
          node.remove();
          const value = arguments[+textContent.slice(2)];
          const set = (value) => {
            const oldNodes = parent.childNodes;
            const newNodes = Array.isArray(value) ? value : [value];
            for (let i = 0, n = Math.max(oldNodes.length, newNodes.length); i < n; i++) {
              const oldNode = oldNodes[i];
              const newNode = newNodes[i];
              const nodeof = (node) => (isNode(node) ? node : document.createTextNode(node));
              if (oldNode !== newNode) {
                if (oldNode === undefined) parent.appendChild(nodeof(newNode));
                else if (newNode === undefined) parent.removeChild(oldNode);
                else parent.replaceChild(nodeof(newNode), oldNode);
              }
            }
          };
          if (typeof value !== "function") set(value);
          else bind(() => set(value(data)), global);
        }
        break;
      }
    }
  }

  return postprocess(root);
}
