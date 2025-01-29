// Inspired by https://github.com/vanjs-org/van/blob/main/src/van.js

const propSetterCache = {};

const protoOf = Object.getPrototypeOf;

const isObservable = (d) => typeof d === "function" && "__observe__" in d;

const isObject = (d) => protoOf(d ?? 0) === protoOf({});

const isMountable = (d) => d || d === 0;

const create = (ns, name, a, b) => {
  const [props, children] = isObject(a) ? [a, b ?? []] : [{}, a ?? []];

  const dom = ns ? document.createElementNS(ns, name) : document.createElement(name);

  for (const [k, v] of Object.entries(props)) {
    // This is for some attributes like innerHTML, textContent, etc.
    const getPropDescriptor = (proto) =>
      proto ? (Object.getOwnPropertyDescriptor(proto, k) ?? getPropDescriptor(protoOf(proto))) : undefined;
    const cacheKey = name + "," + k;
    const propSetter = (propSetterCache[cacheKey] ??= getPropDescriptor(protoOf(dom))?.set ?? 0);

    let old;
    const setter = k.startsWith("on")
      ? (v) => {
          const event = k.slice(2);
          old && dom.removeEventListener(event, old);
          dom.addEventListener(event, (old = v));
        }
      : propSetter
        ? propSetter.bind(dom)
        : dom.setAttribute.bind(dom, k);

    if (isObservable(v)) v(setter);
    else setter(v);
  }

  for (const child of children.flat()) {
    if (isObservable(child)) child(dom);
    else if (isMountable(child)) dom.append(child);
  }

  return dom;
};

const handler = (ns) => ({get: (_, name) => create.bind(undefined, ns, name)});

export const html = new Proxy((ns) => new Proxy(create, handler(ns)), handler());
