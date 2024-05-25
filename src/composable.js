import {ATTR_COMPOSABLE} from "./constants.js";
import {Attribute} from "./attribute.js";

export function composable() {
  return new Attribute(ATTR_COMPOSABLE, arguments);
}
