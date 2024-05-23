import {TYPE_ELEMENT, TYPE_TEXT, DATA_STATE, DATA_PROP} from "./constants.js";
import {Attribute} from "./attribute.js";

const active = new Set();
let flushing = false;

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
  if (template.children.length) return [template, Array.from(template.children)];
  if (template.textContent) {
    const text = document.createTextNode(template.textContent);
    return [text, [text]];
  }
  return [template, [document.createTextNode("")]]; // Create a empty text node to remember the position.
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
  const states = new Map(descriptors);
  return new Proxy(target, {
    get(target, key) {
      if (!states.has(key)) return Reflect.get(target, key);
      const state = states.get(key);
      if (isFunction(state.val) && !state.rawVal) {
        state.rawVal = state.val;
        bind(() => (ref.data[key] = state.rawVal(ref.data)), ref);
      }
      const effect = lastof(ref.effects);
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

function postprocess(node) {
  const template = document.createDocumentFragment();
  const fragment = node.firstChild;
  if (fragment.nodeName !== "FRAGMENT") return node;
  template.append(...fragment.childNodes);
  return template;
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
  for (let i = 0, n = attributes.length; i < n; i++) {
    const {name, value: currentValue} = attributes[i];
    if (/^::/.test(currentValue)) {
      const value = args[+currentValue.slice(2)];
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
  ref.data = observe({}, descriptors, ref);
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
    template.append(...node.children);
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
  let prevI = 0;
  bind(() => {
    for (let i = 0, n = conditions.length; i < n; i++) {
      const [condition, node] = conditions[i];
      if (condition(ref.data) && prevI !== i) {
        prevI = i;
        const template = document.createDocumentFragment();
        template.append(...node.cloneNode(true).children);
        hydrate(template, ref, args);
        insert(template);
        break;
      }
    }
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
        let listener;
        bind(() => {
          if (listener) node.removeEventListener(name, listener);
          listener = (...params) => value(ref.data, ...params);
          node.addEventListener(name, listener);
        }, ref);
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
          bind(() => {
            const string = values.map((d) => (isFunction(d) ? d(ref.data) : d)).join("");
            set(node, name, string);
          }, ref);
        }
      }
    }
  }
  if (isComponent) {
    const descriptors = Object.entries(propsRef.val).map(([name, value]) => [name, {val: value, effects: new Set()}]);
    propsRef.val = observe({}, descriptors, ref);
    const subnode = render(propsRef.val, ref.effects, ref.components.get(node.nodeName));
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
        bind(() => {
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
    if (!node.parentElement && node.nodeName === "FRAGMENT") root = hydrateRoot(walker, node, removeNodes, ref, args);
    else if (node.nodeName === "FOR") root = hydrateFor(walker, node, removeNodes, ref, args);
    else if (node.nodeName === "IF") root = hydrateIf(walker, node, removeNodes, ref, args);
    else if (node.nodeType === TYPE_ELEMENT) root = hydrateElement(walker, node, removeNodes, ref, args);
    else if (node.nodeType === TYPE_TEXT) root = hydrateText(walker, node, removeNodes, ref, args);
    else root = walker.nextNode();
  }
  removeNodes.forEach((node) => node.remove());
}

function render(props, effects, args) {
  const [{raw: strings}] = args;
  let string = "";
  for (let j = 0, m = args.length; j < m; j++) {
    const input = strings[j];
    if (j > 0) string += "::" + j;
    string += input;
  }
  const root = renderHtml(string);
  const ref = {data: null, effects, components: new Map(), props};
  hydrate(root, ref, args);
  return postprocess(root);
}

export function html() {
  return render({}, [], arguments);
}
