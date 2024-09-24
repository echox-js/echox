import {controlFlow} from "./controlFlow.js";
import {h, patch} from "./mount.js";
import {reactive, track} from "./reactive.js";
import {isDef, createDocumentFragment, childNodes} from "./shared.js";
import {remove} from "./unmount.js";

export const For = controlFlow(reactive().get("of"), (d, parent) => {
  const indexByDatum = new Map();
  const scopeByDatum = new Map();
  let prevNodes = [];
  const replace = patch(parent);
  track(() => {
    const of = d.of ?? [];
    const enter = [];
    const move = [];
    const exit = new Set(indexByDatum.keys());
    const newNodes = [];

    for (let i = 0; i < of.length; i++) {
      const datum = of[i];
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
      const datum = of[to];
      const nodes = prevNodes[from];
      const scope = scopeByDatum.get(datum);
      scope.index = to;
      indexByDatum.set(datum, to);
      newNodes[to] = nodes;
    }

    for (const i of enter) {
      const datum = of[i];
      indexByDatum.set(datum, i);
      const el = createDocumentFragment();
      const scope = reactive()
        .let("val", () => datum)
        .let("index", () => i)
        .join();
      d.children.forEach((child) => h(el, child, scope));
      scopeByDatum.set(datum, scope);
      newNodes[i] = [...childNodes(el)];
    }

    replace((prevNodes = newNodes).flat(Infinity));

    return prevNodes[0];
  });
});
