import {node} from "./html.js";
import {reactive} from "./reactive.js";

export const component = (scope, template) => node(template ? [scope, template] : [reactive(), scope]);
