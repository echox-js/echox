import {maybeCall, symbol, childNodes} from "./shared.js";

export const UNMOUNT = symbol();

export const dispose = (node) => {
  const disposes = [];
  const collect = (node) => {
    childNodes(node).forEach(collect);
    node[UNMOUNT] && disposes.push(node[UNMOUNT]);
  };
  collect(node);
  disposes.forEach(maybeCall);
};

export const remove = (node) => (node.remove(), dispose(node));

export const unmount = (node) => (dispose(node), (node.innerHTML = ""));
