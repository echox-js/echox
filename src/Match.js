import {controlFlow} from "./controlFlow.js";
import {reactive, track} from "./reactive.js";
import {isFunc, isDef, createDocumentFragment, childNodes} from "./shared.js";
import {h, patch} from "./mount.js";

export const Match = controlFlow(reactive().get("test").get("value"), (d, parent) => {
  const test = ({props: {test}}) => (isDef(d.value) ? test === d.value : isFunc(test) && test());
  const replace = patch(parent);
  let prev, prevNodes;
  track(() => {
    const index = isDef(d.test) ? +!d.test : d.children.findIndex((c) => c.tag[1]?.arm && (!c.props?.test || test(c)));
    if (index !== prev) {
      const root = createDocumentFragment();
      h(root, d.children[index]);
      replace((prevNodes = [...childNodes(root)]));
    }
    prev = index;
    return prevNodes[0];
  });
});
