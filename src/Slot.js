import {controlFlow} from "./controlFlow.js";
import {h} from "./mount.js";
import {reactive} from "./reactive.js";

export const Slot = controlFlow(reactive().get("from"), (d, parent) => {
  const fromNodes = [d.from].flat(Infinity);
  (fromNodes.length ? fromNodes : d.children).forEach((child) => h(parent, child));
});
