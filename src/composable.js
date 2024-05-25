import {ATTR_COMPOSABLE} from "./render.js";
import {Attribute} from "./attribute.js";

export function composable() {
  return new Attribute(ATTR_COMPOSABLE, arguments);
}
