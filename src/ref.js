import {ATTR_REF} from "./render.js";
import {Attribute} from "./attribute.js";

export function ref() {
  return new Attribute(ATTR_REF);
}
