import {controlFlow} from "./controlFlow.js";
import {mount} from "./mount.js";
import {reactive} from "./reactive.js";

export const Slot = controlFlow(
  reactive().get("from", (d) => () => d.children),
  (d, parent) => {
    const fromNodes = [d.from].flat(Infinity);
    (fromNodes.length ? fromNodes : d.children).forEach((child) => mount(parent, child));
  },
);
