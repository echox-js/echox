import {ATTR_COMPONENT} from "./render.js";
import {Attribute} from "./attribute.js";

export function component() {
  return new Attribute(ATTR_COMPONENT, arguments);
}
