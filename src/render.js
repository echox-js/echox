import {TYPE_ELEMENT, TYPE_TEXT, DATA_STATE, DATA_PROP, DATA_EFFECT} from "./constants.js";
import {Attribute} from "./attribute.js";

let active;

function noop() {}

function isNode(d) {
  return d instanceof Node;
}

function isString(d) {
  return typeof d === "string";
}

function isFunction(d) {
  return typeof d === "function";
}

function isDefined(d) {
  return d !== undefined;
}

function isConnected(d) {
  return d._dom.isConnected;
}

function isEffect(state) {
  return isFunction(state.val) && state.val._effect && !state.rawVal;
}

function isComputed(state) {
  return isFunction(state.val) && !state.rawVal;
}

function lastof(array) {
  return array[array.length - 1];
}

function valuesof(string, args) {
  return string
    .split(/(::\d+)/)
    .filter((d) => d !== "" && d !== " ")
    .map((value) => (/^::\d+$/.test(value) ? args[+value.slice(2)] : value));
}

function valueof(props, name, defaultValue) {
  const prop = props[name];
  if (isDefined(prop)) return isFunction(prop) ? prop : () => props[name];
  return defaultValue;
}

function nodeof(value) {
  return isNode(value) ? value : document.createTextNode(value);
}

function templateof(template) {
  if (template.childNodes.length) return [template, Array.from(template.childNodes)];
  if (template.textContent) {
    const text = document.createTextNode(template.textContent);
    return [text, [text]];
  }
  // Create a empty text node to remember the position.
  const sentinel = document.createTextNode("");
  template.append(sentinel);
  return [template, [sentinel]];
}

function track(f, ref, node = {isConnected: true}) {
  const effect = () => (ref.effects.push(effect), f(), ref.effects.pop());
  effect._dom = node;
  ref.init = true;
  effect();
  ref.init = false;
  return effect;
}

function schedule(state) {
  active = (active ?? (requestAnimationFrame(execute), new Set())).add(state);
}

function execute() {
  for (const state of active) {
    state.effects = cleanup(state.effects);
    state.effects.forEach((e) => e());
  }
  active = undefined;
}

function cleanup(effects) {
  return new Set([...effects].filter(isConnected));
}

function watchComputed(state, ref, key) {
  state.rawVal = state.val;
  track(() => (ref.data[key] = state.rawVal(ref.data)), ref);
}

function watchEffect(state, ref) {
  (state.rawVal = state.val), (state.val = null);
  track(() => (state.val?.(), (state.val = state.rawVal(ref.data))), ref);
}

function watch(target, descriptors, ref) {
  const states = new Map(descriptors);
  return new Proxy(target, {
    get(target, key) {
      let state;
      if (!(state = states.get(key))) return Reflect.get(target, key);
      if (isEffect(state)) watchEffect(state, ref);
      else if (isComputed(state)) watchComputed(state, ref, key);
      const effect = lastof(ref.effects);
      if (effect) (state.effects = ref.init ? state.effects : cleanup(state.effects, isConnected)).add(effect);
      return state.val;
    },
    set(target, key, value) {
      let state;
      if (!(state = states.get(key))) return Reflect.set(target, key, value);
      if (state.val !== value) (state.val = value), schedule(state);
      return true;
    },
  });
}

function insertBefore(parent, node) {
  const temp = parent.insertBefore(document.createElement("fragment"), node);
  const prevNodes = [temp];
  return (template) => {
    const [root, children] = templateof(template);
    const last = lastof(prevNodes);
    const actualParent = last.parentElement; // The ordinal parent may have changed.
    actualParent.insertBefore(root, last.nextSibling);
    prevNodes.forEach((node) => node.remove());
    prevNodes.length = 0;
    prevNodes.push(...children);
  };
}

function postprocess(node, sentinel) {
  const template = document.createDocumentFragment();
  const fragment = node.firstChild;
  if (fragment.nodeName !== "DEFINE") template.append(sentinel, node);
  else template.append(sentinel, ...fragment.childNodes);
  return template;
}

function observable(template) {
  if (template.childNodes.length === 1) return template.firstChild;
  const div = document.createElement("div");
  div.append(...template.childNodes);
  return div;
}

function destroy(root) {
  const walker = document.createTreeWalker(root);
  root._observer.disconnect();
  root.remove();
  while ((root = walker.nextNode()) && (root._clear?.(), true));
}

function observe(root) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.removedNodes) {
        node._clear?.();
      }
    }
  });
  observer.observe(root, {childList: true, subtree: true});
  Object.assign(root, {_observer: observer});
}

function renderHtml(string) {
  const template = document.createElement("template");
  template.innerHTML = string;
  return document.importNode(template.content, true);
}

function hydrateRoot(walker, node, removeNodes, ref, args) {
  const {attributes} = node;
  const descriptors = [];
  const removeAttributes = [];
  const effectKeys = [];
  for (let i = 0, n = attributes.length; i < n; i++) {
    const {name, value: currentValue} = attributes[i];
    let value;
    if (/^::\d+/.test(name) && (value = args[+name.slice(2)]) instanceof Attribute && value.t === DATA_EFFECT) {
      const key = "_effect_" + name.slice(2);
      const v = value.v;
      v._effect = true;
      descriptors.push([key, {val: value.v, effects: new Set()}]);
      effectKeys.push(key);
      removeAttributes.push(name);
    } else if (/^::\d+/.test(currentValue) && ((value = args[+currentValue.slice(2)]), true)) {
      if (name === "components") {
        for (const [n, c] of Object.entries(value)) ref.components.set(n.toUpperCase(), c);
        removeAttributes.push(name);
      } else if (value instanceof Attribute) {
        const {t, v} = value;
        if (t === DATA_STATE) descriptors.push([name, {val: v, effects: new Set()}]);
        else if (t === DATA_PROP) descriptors.push([name, {val: valueof(ref.props, name, v), effects: new Set()}]);
        removeAttributes.push(name);
      }
    }
  }
  ref.data = watch({}, descriptors, ref);
  effectKeys.forEach((key) => ref.data[key]);
  ref.sentinel._clear = () => effectKeys.forEach((key) => ref.data[key]?.());
  removeAttributes.forEach((name) => node.removeAttribute(name));
  return walker.nextNode();
}

function hydrateFor(walker, node, removeNodes, ref, args) {
  walker.nextSibling();
  const each = node.attributes["each"].value;
  let value;
  if (/::\d+/.test(each) && isFunction((value = args[+each.slice(2)]))) {
    const array = value(ref.data);
    const template = document.createDocumentFragment();
    template.append(...node.childNodes);
    for (let i = 0, n = array.length; i < n; i++) {
      [ref.data.$item, ref.data.$index, ref.data.$array] = [array[i], i, array];
      const cloned = template.cloneNode(true);
      hydrate(cloned, ref, args);
      node.parentNode.insertBefore(cloned, node);
    }
    node.removeAttribute("each");
    removeNodes.push(node);
  }
  return walker.currentNode;
}

function hydrateIf(walker, node, removeNodes, ref, args) {
  let current = node;
  const names = new Set(["IF", "ELIF", "ELSE"]);
  const white = (node) => node.nodeType === 3 && !node.textContent.trim();
  const conditions = [];
  while (current && (names.has(current.nodeName) || white(current))) {
    removeNodes.push(current);
    if (white(current)) noop();
    else if (current.nodeName === "ELSE") conditions.push([() => true, current]);
    else {
      const expr = current.attributes["expr"].value;
      let value;
      if (/::\d+/.test(expr) && isFunction((value = args[+expr.slice(2)]))) conditions.push([value, current]);
    }
    current = walker.nextSibling();
  }
  const insert = insertBefore(node.parentNode, node);
  let prevI = null;
  track(() => {
    let match = false;
    for (let i = 0, n = conditions.length; i < n; i++) {
      const [condition, node] = conditions[i];
      if (condition(ref.data) && prevI !== i) {
        (prevI = i), (match = true);
        const template = document.createDocumentFragment();
        template.append(...node.cloneNode(true).childNodes);
        hydrate(template, ref, args);
        insert(template);
        break;
      }
    }
    if (!match) (prevI = null), insert(document.createDocumentFragment());
  }, ref);
  return walker.currentNode;
}

function hydrateElement(walker, node, removeNodes, ref, args) {
  const {attributes} = node;
  const removeAttributes = [];
  const propsRef = {val: {}};
  const isComponent = ref.components.has(node.nodeName);
  const set = isComponent
    ? (_, name, value) => (propsRef.val[name] = value)
    : (node, name, value) => node.setAttribute(name, value);
  const listen = isComponent
    ? (node, name, value) => {
        const method = (...params) => value(ref.data, ...params);
        set(node, name, () => method);
      }
    : (node, name, value) => {
        const listener = (...params) => value(ref.data, ...params);
        node.addEventListener(name, listener);
      };
  for (let i = 0, n = attributes.length; i < n; i++) {
    const {name, value: currentValue} = attributes[i];
    if (/::\d+/.test(currentValue)) {
      if (name.startsWith("@")) {
        const value = args[+currentValue.slice(2)];
        listen(node, name.slice(1), value);
        removeAttributes.push(name);
      } else {
        const values = valuesof(currentValue, args);
        if (values.every(isString)) set(node, name, values.join(""));
        else {
          // TODO: Should track this mock node?
          const n = isComponent ? undefined : node;
          const f = () => {
            const string = values.map((d) => (isFunction(d) ? d(ref.data) : d)).join("");
            set(n, name, string);
          };
          track(f, ref, n);
        }
      }
    }
  }
  if (isComponent) {
    const descriptors = Object.entries(propsRef.val).map(([n, val]) => [n, {val, effects: new Set()}]);
    propsRef.val = watch({}, descriptors, ref);
    const subnode = h(propsRef.val, ref.effects, ref.components.get(node.nodeName));
    node.parentNode.insertBefore(subnode, node);
    removeNodes.push(node);
  }
  removeAttributes.forEach((name) => node.removeAttribute(name));
  return walker.nextNode();
}

function hydrateText(walker, node, removeNodes, ref, args) {
  const {textContent: rawContent} = node;
  const textContent = rawContent.trim();
  if (/::\d+/.test(textContent)) {
    const parent = node.parentNode;
    const values = valuesof(textContent, args);
    for (let i = 0, n = values.length; i < n; i++) {
      const value = values[i];
      if (!isFunction(value)) parent.insertBefore(nodeof(value), node);
      else {
        const insert = insertBefore(node.parentNode, node);
        track(() => {
          const fragments = value(ref.data);
          const values = Array.isArray(fragments) ? fragments : [fragments];
          const template = document.createDocumentFragment();
          template.append(...values.map(nodeof));
          insert(template);
        }, ref);
      }
    }
    removeNodes.push(node);
  }
  return walker.nextNode();
}

function hydrate(root, ref, args) {
  const removeNodes = [];
  const walker = document.createTreeWalker(root);
  while (root) {
    const node = walker.currentNode;
    if (!node.parentElement && node.nodeName === "DEFINE") root = hydrateRoot(walker, node, removeNodes, ref, args);
    else if (node.nodeName === "FOR") root = hydrateFor(walker, node, removeNodes, ref, args);
    else if (node.nodeName === "IF") root = hydrateIf(walker, node, removeNodes, ref, args);
    else if (node.nodeType === TYPE_ELEMENT) root = hydrateElement(walker, node, removeNodes, ref, args);
    else if (node.nodeType === TYPE_TEXT) root = hydrateText(walker, node, removeNodes, ref, args);
    else root = walker.nextNode();
  }
  removeNodes.forEach((node) => node.remove());
}

function h(props, effects, args) {
  const [{raw: strings}] = args;
  let string = "";
  for (let j = 0, m = args.length; j < m; j++) {
    const input = strings[j];
    if (j > 0) string += "::" + j;
    string += input;
  }
  const root = renderHtml(string);
  const sentinel = document.createTextNode("");
  const ref = {data: null, effects, components: new Map(), props, sentinel};
  hydrate(root, ref, args);
  return postprocess(root, sentinel);
}

export function render(args) {
  const node = h({}, [], args);
  const root = observable(node);
  observe(root);
  return Object.assign(root, {destroy: () => destroy(root)});
}
