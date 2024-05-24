import {DATA_COMPOSITION} from "./constants.js";
import {Attribute} from "./attribute.js";

export function composition(value) {
  return new Attribute(DATA_COMPOSITION, value);
}
