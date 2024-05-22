import {TYPE_ELEMENT, TYPE_TEXT, TYPE_ROOT, TYPE_FOR, TYPE_IF, DATA_STATE, DATA_PROP} from "./constants.js";
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
  const states = new Map(descriptors);
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
        : node.nodeName === "IF"
        ? TYPE_IF
        : node.nodeType;

    switch (nodeType) {
      case TYPE_ROOT: {
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
              switch (t) {
                case DATA_STATE:
                  descriptors.push([name, {val: v, effects: new Set()}]);
                  break;
                case DATA_PROP: {
                  descriptors.push([name, {val: ref.props[name] ? () => ref.props[name] : v, effects: new Set()}]);
                  break;
                }
              }
              removeAttributes.push(name);
            }
          }
        }
        ref.data = observe({}, descriptors, ref);
        removeAttributes.forEach((name) => node.removeAttribute(name));
        break;
      }
      case TYPE_FOR: {
        walker.nextSibling();
        const each = node.attributes["each"].value;
        const parent = node.parentNode;
        const actualParent = parent.insertBefore(document.createElement("fragment"), node);
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
              const clone = children[j].cloneNode(true);
              hydrate(clone, ref, args);
              actualParent.appendChild(clone);
            }
          }
          children.forEach((d) => d.remove());
          node.removeAttribute("each");
          removeNodes.push(node);
        }
        walker.previousNode();
        break;
      }
      case TYPE_IF: {
        let current = node;
        const names = new Set(["IF", "ELIF", "ELSE"]);
        const white = (node) => node.nodeType === 3 && !node.textContent.trim();
        const conditions = [];
        while (current && (names.has(current.nodeName) || white(current))) {
          removeNodes.push(current);
          if (white(current)) noop();
          else if (current.nodeName === "ELSE") conditions.push([() => true, current]);
          else {
            removeNodes.push(current);
            const expr = current.attributes["expr"].value;
            let value;
            if (/::\d+/.test(expr) && isFunction((value = args[+expr.slice(2)]))) conditions.push([value, current]);
          }
          current = walker.nextSibling();
        }
        let prevI = 0;
        const parent = node.parentNode.insertBefore(document.createElement("fragment"), node);
        bind(() => {
          for (let i = 0, n = conditions.length; i < n; i++) {
            const [condition, node] = conditions[i];
            if (condition(ref.data) && prevI !== i) {
              (prevI = i), (parent.innerHTML = "");
              for (let j = 0, cloned = [...node.children], m = cloned.length; j < m; j++) {
                const clone = cloned[j].cloneNode(true);
                hydrate(clone, ref, args);
                parent.appendChild(clone);
              }
              break;
            }
          }
        }, ref);
        walker.previousNode();
        break;
      }
      case TYPE_ELEMENT: {
        const {attributes} = node;
        const propsRef = {val: {}};
        const isComponent = ref.components.has(node.nodeName);
        const set = isComponent
          ? (_, name, value) => (propsRef.val[name] = value)
          : (node, name, value) => node.setAttribute(name, value);
        const listen = isComponent
          ? (node, name, value) => set(node, name, (...params) => value(ref.data, ...params))
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
              node.removeAttribute(name);
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
          const descriptors = Object.entries(propsRef.val).map(([name, value]) => [
            name,
            {val: value, effects: new Set()},
          ]);
          propsRef.val = observe({}, descriptors, ref);
          const subnode = render(propsRef.val, ref.effects, ref.components.get(node.nodeName));
          node.parentNode.insertBefore(subnode, node);
          removeNodes.push(node);
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
            if (!isFunction(value)) parent.insertBefore(nodeof(value), node);
            else {
              // TODO: Remove fragment for parent with only one child.
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
  return root;
}

export function html() {
  return render({}, [], arguments);
}
