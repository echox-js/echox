export const symbol = Symbol;

export const doc = document;

export const Obj = Object;

export const assign = Obj.assign;

export const entries = Obj.entries;

export const isStr = (d) => typeof d === "string";

export const isFunc = (d) => typeof d === "function";

export const isExpr = (d) => isFunc(d) && !d.tag && !d.cf;

export const isNode = (d) => isFunc(d) && d.tag;

export const isControl = (d) => isFunc(d) && d.cf;

export const isDef = (d) => d !== undefined;

export const isObject = (d) => d instanceof Obj && !(d instanceof Function);

export const isArray = Array.isArray;

export const isNatural = (d) => Number.isInteger(d) && d >= 0;

export const maybeCall = (d) => (isFunc(d) ? d() : d);

export const from = (obj, callback) => Obj.fromEntries(entries(obj).map(([k, v]) => [k, callback(v, k)]));

export const createDocumentFragment = doc.createDocumentFragment.bind(doc);

export const childNodes = (d) => d.childNodes;
