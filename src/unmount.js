import {maybeCall, symbol} from "./shared.js";

export const UNMOUNT = symbol();

export const dispose = (node) => {
  const disposes = [];
  const collect = (node) => {
    node.childNodes.forEach(collect);
    if (node[UNMOUNT]) disposes.push(node[UNMOUNT]);
  };
  collect(node);
  disposes.forEach(maybeCall);
};

export const remove = (node) => (node.remove(), dispose(node));

export const unmount = (node) => (dispose(node), (node.innerHTML = ""));
