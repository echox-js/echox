const isPlainObject = (d) => d && d.constructor === Object;

const kebabCase = (string) => string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();

export const css = (...styles) =>
  styles
    .reverse()
    .filter(isPlainObject)
    .flatMap(Object.entries)
    .map(([k, v]) => `${kebabCase(k)}: ${v}`)
    .join(";");

export const cx = (...names) =>
  names
    .flatMap((d) =>
      isPlainObject(d)
        ? Object.entries(d)
            .filter(([, v]) => v)
            .map(([k]) => k)
        : d,
    )
    .filter((d) => typeof d === "string" && !!d)
    .join(" ");
