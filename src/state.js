import {ATTR_STATE} from "./constants.js";
import {Attribute} from "./attribute.js";

export function state(value) {
  return new Attribute(ATTR_STATE, value);
}
