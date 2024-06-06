import {it, expect} from "vitest";
import * as X from "echox";

it("html(strings, ...values) should render static element.", () => {
  const node = X.html`<span>hello</span>`;
  expect(node.outerHTML).toBe("<span>hello</span>");
  node.destroy();
});

it("html(strings, ...values) should render stateful element.", () => {
  const node = X.html`<span x-text=${X.state("hello")}>${(d) => d.text}</div>`;
  expect(node.outerHTML).toBe("<span>hello</span>");
  node.destroy();
});
