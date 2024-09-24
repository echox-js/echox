import {assign} from "./shared.js";

const handler = (ns) => ({get: (_, tag) => node(tag, ns)});

export const node =
  (tag, ns) =>
  (props = {}) => {
    const create = (...c) => ((create.children = c), create);
    return assign(create, {props, tag, ns, children: []});
  };

export const html = new Proxy((ns) => new Proxy({}, handler(ns)), handler());
