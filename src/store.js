import {Attribute} from "./attribute.js";
import {setup, renderHtml, ATTR_STORE} from "./render.js";

export function store() {
  let data;
  const args = arguments;
  return () => new Attribute(ATTR_STORE, (data = data ?? setup(renderHtml(args), {}, args).data));
}
