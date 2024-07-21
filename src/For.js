import {controlFlow} from "./controlFlow.js";
import {mount, patch} from "./mount.js";
import {reactive, track} from "./reactive.js";
import {isDef} from "./shared.js";
import {remove} from "./unmount.js";

export const For = controlFlow(reactive().get("each"), (d, parent) => {
  const indexByDatum = new Map();
  const scopeByDatum = new Map();
  let prevNodes = [];
  const replace = patch(parent);
  track(() => {
    const each = d.each ?? [];
    const enter = [];
    const move = [];
    const exit = new Set(indexByDatum.keys());
    const newNodes = [];

    for (let i = 0; i < each.length; i++) {
      const datum = each[i];
      const index = indexByDatum.get(datum);
      exit.delete(datum);
      if (!isDef(index)) enter.push(i);
      else if (index !== i) move.push([index, i]);
      else if (index === i) newNodes[i] = prevNodes[i];
    }

    for (const datum of exit) {
      const index = indexByDatum.get(datum);
      const nodes = prevNodes[index];
      nodes.forEach(remove);
      indexByDatum.delete(datum), scopeByDatum.delete(datum);
    }

    for (const [from, to] of move) {
      const datum = each[to];
      const nodes = prevNodes[from];
      const scope = scopeByDatum.get(datum);
      scope.index = to;
      indexByDatum.set(datum, to);
      newNodes[to] = nodes;
    }

    for (const i of enter) {
      const datum = each[i];
      indexByDatum.set(datum, i);
      const el = document.createDocumentFragment();
      const scope = reactive()
        .let("val", () => datum)
        .let("index", () => i)
        .join();
      d.children.forEach((child) => mount(el, child, scope));
      scopeByDatum.set(datum, scope);
      newNodes[i] = [...el.childNodes];
    }

    replace((prevNodes = newNodes).flat(Infinity));
  });
});
