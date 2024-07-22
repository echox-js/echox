import * as EchoX from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";

const {html} = EchoX;

test("Fragment should render children", () => {
  withContainer((el) => {
    const App = EchoX.component(EchoX.Fragment()(html.h1()("Hello, World!"), html.p()("This is a test.")));
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1><p>This is a test.</p>`);
  });
});

test("Fragment should render nested structure", () => {
  withContainer((el) => {
    const App = EchoX.component(
      EchoX.Fragment()(html.h1()("Hello, World!"), EchoX.Fragment()(html.p()("This is a test."))),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1><p>This is a test.</p>`);
  });
});
