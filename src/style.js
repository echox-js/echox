const isObject = (d) => d && typeof d === "object" && !Array.isArray(d);

const kebabCase = (string) => string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();

export const css = (...styles) =>
  styles
    .reverse()
    .filter(isObject)
    .flatMap(Object.entries)
    .map(([k, v]) => `${kebabCase(k)}: ${v}`)
    .join(";");

export const cx = (...names) =>
  names
    .flatMap((d) =>
      isObject(d)
        ? Object.entries(d)
            .filter(([, v]) => v)
            .map(([k]) => k)
        : d,
    )
    .filter((d) => typeof d === "string" && !!d)
    .join(" ");
