import {ATTR_COMPONENT} from "./constants.js";
import {Attribute} from "./attribute.js";

export function component() {
  return new Attribute(ATTR_COMPONENT, arguments);
}
