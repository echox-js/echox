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
  return f();
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
  const removeNodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeType = !node.parentElement ? TYPE_ROOT : node.nodeType;
    switch (nodeType) {
      case TYPE_ROOT: {
        const {attributes} = node;
        const descriptors = {[DATA_STATE]: []};
        const removeAttributes = [];
        for (let i = 0, n = attributes.length, value; i < n; i++) {
          const {name, value: currentValue} = attributes[i];
          if (/^::/.test(currentValue) && (value = arguments[+currentValue.slice(2)]) instanceof Attribute) {
            const {t, v} = value;
            descriptors[t].push([name, {val: v, effects: []}]);
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
          if (/^::/.test(currentValue)) {
            const value = arguments[+currentValue.slice(2)];
            if (name.startsWith("@")) {
              node.addEventListener(name.slice(1), (...params) => value(data, ...params));
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
          const nodeof = (node) => (isNode(node) ? node : document.createTextNode(node));
          const updateLastNodeRef = (ref, node) => ref && ((ref.current = node), (node.__ref__ = ref));
          const parent = node.parentNode;
          const values = textContent
            .split(/(::\d+)/)
            .filter((d) => d !== "" && d !== " ")
            .map((value) => (/^::\d+$/.test(value) ? arguments[+value.slice(2)] : value))
            .flat(Infinity);

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
