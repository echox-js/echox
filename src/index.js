const TYPE_ELEMENT = 1;
const TYPE_TEXT = 3;
const ATTR_STATE = 1;
const ATTR_PROP = 2;
const ATTR_EFFECT = 3;
const ATTR_COMPOSABLE = 4;
const ATTR_METHOD = 5;
const ATTR_COMPONENT = 6;
const ATTR_STORE = 7;
const ATTR_REF = 8;

let active;
let init;
const effects = [];

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

function isPlainObject(d) {
  return d && d.constructor === Object;
}

function lastof(array) {
  return array[array.length - 1];
}

function kebabCase(string) {
  return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
}

function camelcase(string) {
  return string.replace(/-([a-z])/g, (_, d) => d.toUpperCase());
}

function valuesof(string, args) {
  return string
    .split(/(::\d+)/)
    .filter((d) => d !== "" && d !== " ")
    .map((value) => (/^::\d+$/.test(value) ? args[+value.slice(2)] : value));
}

function valueof(values) {
  return values.length === 1 ? values[0] : values.join("");
}

function propof(props, name, defaultValue) {
  const prop = props[name];
  if (isDefined(prop)) return isFunction(prop) ? prop : () => props[name];
  return defaultValue;
}

function nodeof(value) {
  return isNode(value) ? value : document.createTextNode(value);
}

function maybeFunction(value) {
  return isFunction(value) ? value : undefined;
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

function track(f, node = {isConnected: true}) {
  const effect = () => (effects.push(effect), f(), effects.pop());
  effect._dom = node;
  init = true;
  effect();
  init = false;
}

function schedule(state) {
  active = (active ?? (requestAnimationFrame(execute), new Set())).add(state);
}

function execute() {
  const executed = new Set();
  for (const state of active) {
    state.effects = cleanup(state.effects);
    state.effects.forEach((e) => !executed.has(e) && (executed.add(e), e()));
  }
  active = undefined;
}

function cleanup(effects) {
  return new Set([...effects].filter(isConnected));
}

function watchComputed(state, data, key) {
  track(() => {
    if (!state.rawVal) (state.rawVal = state.val), (state.val = state.rawVal(data));
    else data[key] = state.rawVal(data);
  });
}

function watchEffect(state, data) {
  (state.rawVal = state.val), (state.val = null);
  track(() => (state.val?.(), (state.val = maybeFunction(state.rawVal(data)))));
}

function watch(target, descriptors) {
  const states = new Map(descriptors.map(([n, val]) => [n, {val, effects: new Set()}]));
  const data = new Proxy(target, {
    get(target, key) {
      let state;
      if (!(state = states.get(key))) return Reflect.get(target, key);
      if (isEffect(state)) watchEffect(state, data);
      else if (isComputed(state)) watchComputed(state, data, key);
      const effect = lastof(effects);
      if (effect) (state.effects = init ? state.effects : cleanup(state.effects, isConnected)).add(effect);
      return state.val;
    },
    set(target, key, value) {
      let state;
      if (!(state = states.get(key))) return Reflect.set(target, key, value);
      if (state.val !== value) (state.val = value), schedule(state);
      return true;
    },
  });
  return data;
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
  template.append(sentinel, node);
  return template;
}

function walk(root, callback) {
  const walker = document.createTreeWalker(root);
  while ((root = walker.nextNode()) && (callback(root), true));
}

function destroy(root) {
  root._observer.disconnect();
  root.remove();
  walk(root, (node) => (node._clear?.(), node.destroy?.()));
}

function observe(root) {
  const observer = new MutationObserver((mutations) => {
    for (const {removedNodes, addedNodes} of mutations) {
      for (const node of removedNodes) node._clear?.();
      for (const node of addedNodes) node._ref?.();
    }
  });
  observer.observe(root, {childList: true, subtree: true});
  Object.assign(root, {_observer: observer});
  let timer = setInterval(() => root.isConnected && (walk(root, (node) => node._ref?.()), clearInterval(timer)), 0);
}

function renderHtml(args) {
  const [{raw: strings}] = args;
  let string = "";
  for (let j = 0, m = args.length; j < m; j++) {
    const input = strings[j];
    if (j > 0) string += "::" + j;
    string += input;
  }
  const template = document.createElement("template");
  template.innerHTML = string;
  const node = document.importNode(template.content, true);
  return node.firstChild;
}

function Attribute(type, value) {
  this.v = value;
  this.t = type;
}

function setup(node, props, args) {
  const {attributes} = node;
  const descriptors = [];
  const removeAttributes = [];
  const effectKeys = [];
  const refKeys = [];
  const methods = [];
  const composables = [];
  const components = new Map();
  const stores = [];
  for (let i = 0, value, n = attributes.length; i < n; i++) {
    let {name, value: currentValue} = attributes[i];
    if (/^::\d+/.test(name)) (currentValue = name), (name = "_e_" + name.slice(2));
    if (
      name.startsWith("x-") &&
      /^::\d+/.test(currentValue) &&
      (value = args[+currentValue.slice(2)]) instanceof Attribute
    ) {
      const {t, v} = value;
      removeAttributes.push(t === ATTR_EFFECT ? currentValue : name);
      name = name.slice(2);
      name = t === ATTR_COMPONENT ? name : camelcase(name);
      if (t === ATTR_STATE) descriptors.push([name, v]);
      else if (t === ATTR_PROP) descriptors.push([name, propof(props, name, v)]);
      else if (t === ATTR_METHOD) methods.push([name, v]);
      else if (t === ATTR_COMPONENT) components.set(name.toUpperCase(), v);
      else if (t === ATTR_COMPOSABLE) composables.push([name, setup(renderHtml(v), {}, v)]);
      else if (t === ATTR_STORE) stores.push([name, v]);
      else if (t === ATTR_EFFECT) (v._effect = true), descriptors.push([name, v]), effectKeys.push(name);
      else if (t === ATTR_REF) descriptors.push([name, null]), refKeys.push(name);
    }
  }
  const data = watch({}, descriptors);
  const clear = () => (effectKeys.forEach((key) => data[key]?.()), composables.forEach(([, {clear}]) => clear()));
  const refs = new Map(refKeys.map((key) => [key, (node) => (data[key] = node)]));
  methods.forEach(([name, value]) => (data[name] = (...p) => value(data, ...p)));
  composables.forEach(([name, {data: d}]) => (data[name] = d));
  stores.forEach(([name, value]) => (data[name] = value));
  effectKeys.forEach((key) => data[key]);
  removeAttributes.forEach((name) => node.removeAttribute(name));
  return {data, components, clear, refs};
}

function hydrateRoot(walker, node, removeNodes, ref, args) {
  const {data, components, clear, refs} = setup(node, ref.props, args);
  ref.data = data;
  ref.components = components;
  ref.refs = refs;
  ref.sentinel._clear = clear;
  node._root = false;
  return node;
}

function hydrateFor(walker, node, removeNodes, ref, args) {
  walker.nextSibling();
  const each = node.attributes["each"].value;
  let value;
  if (/::\d+/.test(each) && isFunction((value = args[+each.slice(2)]))) {
    const template = document.createDocumentFragment();
    template.append(...node.childNodes);
    const insert = insertBefore(node.parentNode, node);
    // TODO: Memoize this.
    track(() => {
      const array = value(ref.data);
      const parent = document.createDocumentFragment();
      for (let i = 0, n = array.length; i < n; i++) {
        [ref.data.$item, ref.data.$index, ref.data.$array] = [array[i], i, array];
        const cloned = template.cloneNode(true);
        hydrate(cloned, ref, args);
        parent.append(cloned);
      }
      insert(parent);
    });
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
  // TODO: Memoize this use prevI.
  // let prevI = null;
  track(() => {
    let match = false;
    for (let i = 0, n = conditions.length; i < n; i++) {
      const [condition, node] = conditions[i];
      if (condition(ref.data)) {
        // prevI = i;
        match = true;
        const template = document.createDocumentFragment();
        template.append(...node.cloneNode(true).childNodes);
        hydrate(template, ref, args);
        insert(template);
        break;
      }
    }
    if (!match)
      // prevI = null;
      insert(document.createDocumentFragment());
  });
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
        // TODO: Simplify this.
        // A computed state that returns a computed state.
        set(node, name, () => () => method);
      }
    : (node, name, value) => {
        const listener = (...params) => value(ref.data, ...params);
        node.addEventListener(name, listener);
      };
  for (let i = 0, n = attributes.length; i < n; i++) {
    const {name, value: currentValue} = attributes[i];
    if (/::\d+/.test(currentValue)) {
      if (name.startsWith("$")) {
        const value = args[+currentValue.slice(2)];
        listen(node, name.slice(1), value);
        removeAttributes.push(name);
      } else {
        const values = valuesof(currentValue, args);
        if (!values.some(isFunction)) set(node, name, valueof(values));
        else {
          track(() => {
            const evaluated = values.map((d) => (isFunction(d) ? d(ref.data) : d));
            set(node, name, valueof(evaluated));
          }, node);
        }
      }
    } else if (name === "ref" && !isComponent) {
      // TODO: Add support for refs in components.
      const preRef = node._ref;
      node._ref = () => preRef?.();
      ref.refs.get(currentValue)?.(node);
      removeAttributes.push(name);
    }
  }
  if (isComponent) {
    const descriptors = Object.entries(propsRef.val);
    propsRef.val = watch({}, descriptors, ref);
    const subnode = h(propsRef.val, ref.components.get(node.nodeName));
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
        }, node.parentNode);
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
    if (node._root) root = hydrateRoot(walker, node, removeNodes, ref, args);
    else if (node.nodeName === "FOR") root = hydrateFor(walker, node, removeNodes, ref, args);
    else if (node.nodeName === "IF") root = hydrateIf(walker, node, removeNodes, ref, args);
    else if (node.nodeType === TYPE_ELEMENT) root = hydrateElement(walker, node, removeNodes, ref, args);
    else if (node.nodeType === TYPE_TEXT) root = hydrateText(walker, node, removeNodes, ref, args);
    else root = walker.nextNode();
  }
  removeNodes.forEach((node) => node.remove());
}

function h(props, args) {
  const root = renderHtml(args);
  Object.assign(root, {_root: true});
  const sentinel = document.createTextNode("");
  const ref = {data: null, components: new Map(), props, sentinel};
  hydrate(root, ref, args);
  return postprocess(root, sentinel);
}

export function cx(...names) {
  return names
    .flatMap((d) =>
      isPlainObject(d)
        ? Object.entries(d)
            .filter(([, v]) => v)
            .map(([k]) => k)
        : d,
    )
    .filter((d) => isString(d) && !!d)
    .join(" ");
}

export function css(...styles) {
  return styles
    .reverse()
    .filter(isPlainObject)
    .flatMap(Object.entries)
    .map(([k, v]) => `${kebabCase(k)}: ${v}`)
    .join("; ");
}

export function effect(callback) {
  return new Attribute(ATTR_EFFECT, callback);
}

export function component() {
  return new Attribute(ATTR_COMPONENT, arguments);
}

export function composable() {
  return new Attribute(ATTR_COMPOSABLE, arguments);
}

export function method(value) {
  return new Attribute(ATTR_METHOD, value);
}

export function prop(defaultValue) {
  return new Attribute(ATTR_PROP, defaultValue);
}

export function state(value) {
  return new Attribute(ATTR_STATE, value);
}

export function ref() {
  return new Attribute(ATTR_REF);
}

export function store() {
  let data;
  const args = arguments;
  return () => new Attribute(ATTR_STORE, (data = data ?? setup(renderHtml(args), {}, args).data));
}

export function html() {
  const node = h({}, arguments);
  const root = node.firstElementChild;
  observe(root);
  return Object.assign(root, {destroy: () => destroy(root)});
}
