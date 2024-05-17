import {TYPE_ELEMENT, TYPE_TEXT, DATA_STATE, TYPE_ROOT} from "./constants.js";
import {defineStateAttribute} from "./state.js";
import {Attribute} from "./attribute.js";

function renderHtml(string) {
  const template = document.createElement("template");
  template.innerHTML = string;
  return document.importNode(template.content, true);
}

function bind(f, global) {
  global.effect = f;
  f();
}

export function html({raw: strings}) {
  let string = "";
  for (let j = 0, m = arguments.length; j < m; j++) {
    const input = strings[j];
    if (j > 0) string += "::" + j;
    string += input;
  }

  const data = {};
  const global = {effect: null};
  const root = renderHtml(string);
  const walker = document.createTreeWalker(root);

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeType = !node.parentElement ? TYPE_ROOT : node.nodeType;
    switch (nodeType) {
      case TYPE_ROOT: {
        const {attributes} = node;
        for (let i = 0, n = attributes.length, value; i < n; i++) {
          const {name, value: currentValue} = attributes[i];
          if (/^::/.test(currentValue) && (value = arguments[+currentValue.slice(2)]) instanceof Attribute) {
            if (!node.parentElement && value instanceof Attribute) {
              const {t, v} = value;
              switch (t) {
                case DATA_STATE: {
                  defineStateAttribute(data, name, v, global);
                  break;
                }
              }
              node.setAttribute(name, v);
            }
          }
        }
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
              if (!typeof value === "function") node.setAttribute(name, value);
              else bind(() => node.setAttribute(name, value(data)), global);
            }
          }
        }
        break;
      }
      case TYPE_TEXT: {
        const {textContent} = node;
        if (/^::/.test(textContent)) {
          const value = arguments[+textContent.slice(2)];
          if (!typeof value === "function") node.textContent = value;
          else bind(() => (node.textContent = value(data)), global);
        }
        break;
      }
    }
  }

  return root;
}
