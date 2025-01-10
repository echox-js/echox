const propSetterCache = {};

const protoOf = Object.getPrototypeOf;

const isBind = (d) => typeof d === "function" && "__track__" in d;

const isObject = (d) => protoOf(d ?? 0) === protoOf({});

const isMountable = (d) => d || d === 0;

const handler = (_, name) => (a, b) => {
  const [props, children] = isObject(a) ? [a, b ?? []] : [{}, a ?? []];

  const dom = document.createElement(name);

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

    if (isBind(v)) v.__track__(() => setter(v()));
    else setter(v);
  }

  for (const child of children.flat()) {
    if (isBind(child)) {
      // Use a guard node to remember the position to insert the new nodes.
      const guard = new Text("");
      dom.append(guard);

      let prevNodes;
      child.__track__(() => {
        if (prevNodes) prevNodes.forEach((node) => node.remove());
        const nodes = [child()].flat().filter(isMountable);
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const node = n?.nodeType ? n : new Text(n);
          nodes[i] = node;
          dom.insertBefore(node, guard);
        }
        prevNodes = nodes;
        return guard;
      });
    } else if (isMountable(child)) dom.append(child);
  }

  return dom;
};

export const html = new Proxy({}, {get: handler});
