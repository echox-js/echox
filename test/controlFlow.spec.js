import Echo from "echox";
import {test, expect} from "vitest";

test("controlFlow should store functional template in tag.", () => {
  const children = (d) => d.children;
  const Fragment = Echo.controlFlow(children);
  const app = Fragment();
  expect(app.tag[0]).toBe(children);
});
