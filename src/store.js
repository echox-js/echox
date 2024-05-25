import {Attribute} from "./attribute.js";
import {ATTR_STORE} from "./constants.js";
import {setup, renderHtml} from "./render.js";

export function store() {
  let data;
  const args = arguments;
  return () => new Attribute(ATTR_STORE, (data = data ?? setup(renderHtml(args), {}, args).data));
}
