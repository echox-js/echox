import {ATTR_EFFECT} from "./render.js";
import {Attribute} from "./attribute.js";

export function effect(callback) {
  return new Attribute(ATTR_EFFECT, callback);
}
