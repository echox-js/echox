export const method =
  (fn) =>
  (d) =>
  (...params) =>
    fn(d, ...params);
