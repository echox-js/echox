import {DATA_PROP} from "./constants.js";
import {Attribute} from "./attribute.js";

export function prop(defaultValue) {
  return new Attribute(DATA_PROP, defaultValue);
}
