import {DATA_STATE} from "./constants.js";
import {Attribute} from "./attribute.js";

export function state(string) {
  return new Attribute(DATA_STATE, string);
}
