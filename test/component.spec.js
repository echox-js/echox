import Echo, {X} from "echox";
import {test, expect} from "vitest";

test("component should store template in tag.", () => {
  const div = X.div()("hello world");
  const Div = Echo.component(div);
  const app = Div();
  expect(app.tag[0]).toBe(div);
});

test("component should construct nested structure.", () => {
  const Div = Echo.component(X.div());
  const App = Echo.component(Div()(X.h1()("Hello, World!"), Div()(X.p()("This is a test."))));
  const app = App();
  expect(app.tag[0].children[1].children[0].children[0]).toBe("This is a test.");
});
