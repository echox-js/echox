import {node} from "./html.js";
import {reactive} from "./reactive.js";

export const component = (...params) => node(params[1] ? params : [reactive(), params[0]]);
