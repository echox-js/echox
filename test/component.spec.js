import Echo, {X} from "echox";
import {test, expect} from "vitest";

test("component(template, reactive) should return node with component tag.", () => {
  const Div = Echo.component(X.div());
  const node = Div();
  const [template, reactive] = node.tag;
  expect(reactive).toBeUndefined();
  expect(template.tag).toBe("div");
  expect(template.props).toBeUndefined();
  expect(template.children).toBeUndefined();
  expect(node.props).toBeUndefined();
  expect(node.children).toBeUndefined();
});
