import {component} from "./component.js";
import {reactive} from "./reactive.js";
import {assign} from "./shared.js";

export const controlFlow = (...params) => {
  const [join, template] = params[1] ? params : [reactive(), params[0]];
  return component(join, assign(template, {cf: true}));
};
