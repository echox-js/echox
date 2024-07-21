import {isObject, entries} from "./shared.js";

const kebabCase = (string) => string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();

export const css = (...styles) =>
  styles
    .reverse()
    .filter(isObject)
    .flatMap(entries)
    .map(([k, v]) => `${kebabCase(k)}: ${v}`)
    .join(";");
