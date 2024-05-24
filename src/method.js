import {DATA_METHOD} from "./constants.js";
import {Attribute} from "./attribute.js";

export function method(value) {
  return new Attribute(DATA_METHOD, value);
}
