const propSetterCache = {};

const protoOf = Object.getPrototypeOf;

const isBind = (d) => typeof d === "function" && "__track__" in d;

const isObject = (d) => protoOf(d ?? 0) === protoOf({});

const handler = (_, name) => (a, b) => {
  const [props, children] = isObject(a) ? [a, b ?? []] : [{}, [a].flat()];

  const dom = document.createElement(name);

  for (const [k, v] of Object.entries(props)) {
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

    if (isBind(v)) v.__track__(() => setter(v()));
    else setter(v);
  }

  for (const child of children) {
    if (isBind(child)) {
      let old;
      child.__track__(() => {
        old?.remove();
        old = child();
        dom.append((old = old?.nodeType ? old : new Text(old ?? "")));
        return old;
      });
    } else if (child) dom.append(child);
  }

  return dom;
};

export const html = new Proxy({}, {get: handler});
