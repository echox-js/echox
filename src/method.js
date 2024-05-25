import {ATTR_METHOD} from "./render.js";
import {Attribute} from "./attribute.js";

export function method(value) {
  return new Attribute(ATTR_METHOD, value);
}
