import {DATA_EFFECT} from "./constants.js";
import {Attribute} from "./attribute.js";

export function effect(callback) {
  return new Attribute(DATA_EFFECT, callback);
}
