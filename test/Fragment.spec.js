import * as ex from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";

const {$} = ex;

test("Fragment should render children", () => {
  withContainer((el) => {
    const App = ex.component(ex.Fragment()($.h1()("Hello, World!"), $.p()("This is a test.")));
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1><p>This is a test.</p>`);
  });
});

test("Fragment should render nested structure", () => {
  withContainer((el) => {
    const App = ex.component(ex.Fragment()($.h1()("Hello, World!"), ex.Fragment()($.p()("This is a test."))));
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1><p>This is a test.</p>`);
  });
});
