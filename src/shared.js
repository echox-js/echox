export const symbol = Symbol;

export const assign = Object.assign;

export const entries = Object.entries;

export const isStr = (d) => typeof d === "string";

export const isFunc = (d) => typeof d === "function";

export const isExpr = (d) => isFunc(d) && !d.tag && !d.cf;

export const isNode = (d) => isFunc(d) && d.tag;

export const isControl = (d) => isFunc(d) && d.cf;

export const isDef = (d) => d !== undefined;

export const isObject = (d) => d instanceof Object && !(d instanceof Function);

export const isArray = Array.isArray;

export const isPositiveInt = (d) => Number.isInteger(d) && d >= 0;

export const maybeCall = (d) => (isFunc(d) ? d() : d);

export const from = (obj, callback) => Object.fromEntries(entries(obj).map(([k, v]) => [k, callback(v, k)]));
