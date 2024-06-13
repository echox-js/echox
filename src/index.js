const node = (tag, ns, _) => (props) => Object.assign((_ = (...c) => ((_.children = c), _)), {props, tag, ns});

const handler = (ns) => ({get: (_, tag) => node(tag, ns)});

export const X = new Proxy((ns) => new Proxy({}, handler(ns)), handler());
