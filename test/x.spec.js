import {X} from "echox";
import {test, expect} from "vitest";

function copy(node, template) {
  if (typeof node !== "object") return;
  node.tag = template.k;
  node.props = template.p;
  if (template.c) {
    node.children = template.c.map((child) => {
      if (typeof child === "string") return child;
      return {};
    });
    for (let i = 0; i < template.c.length; i++) {
      copy(node.children[i], template.c[i]);
    }
  }
  return node;
}

test("X[tagName](props)(...children) should construct nested template.", () => {
  const template = X.div({class: "red"})(
    X.span({class: "blue"})("Hello World"),
    X.div({class: "yellow"})(X.span(), X.span()("Hello World")),
  );
  expect(copy({}, template)).toMatchObject({
    tag: "div",
    props: {class: "red"},
    children: [
      {tag: "span", props: {class: "blue"}, children: ["Hello World"]},
      {
        tag: "div",
        props: {class: "yellow"},
        children: [{tag: "span"}, {tag: "span", children: ["Hello World"]}],
      },
    ],
  });
});

test("X should be assignable.", () => {
  X.test = "test";
  X.div = "test";
  expect(X.test).toBe("test");
  expect(X.div).toBe("test");
});
