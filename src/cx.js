import {isObject, entries, isStr} from "./shared.js";

export const cx = (...names) =>
  names
    .flatMap((d) =>
      isObject(d)
        ? entries(d)
            .filter(([, v]) => v)
            .map(([k]) => k)
        : d,
    )
    .filter((d) => isStr(d) && !!d)
    .join(" ");
