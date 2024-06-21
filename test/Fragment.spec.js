import Echo, {X} from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";

test("Fragment should render children", () => {
  withContainer((el) => {
    const App = Echo.component(Echo.Fragment()(X.h1()("Hello, World!"), X.p()("This is a test.")));
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1><p>This is a test.</p>`);
  });
});

test("Fragment should render nested structure", () => {
  withContainer((el) => {
    const App = Echo.component(Echo.Fragment()(X.h1()("Hello, World!"), Echo.Fragment()(X.p()("This is a test."))));
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1><p>This is a test.</p>`);
  });
});
