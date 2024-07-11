import * as ex from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";

const {$} = ex;

test("Slot should render children", () => {
  withContainer((el) => {
    const Div = ex.component($.div()(ex.Slot({from: (d) => d.children})));
    const App = ex.component(Div()($.h1()("Hello, World!"), Div()($.p()("This is a test."))));
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<div><h1>Hello, World!</h1><div><p>This is a test.</p></div></div>`);
  });
});

test("Slot should render default slot", () => {
  withContainer((el) => {
    const Div = ex.component($.div()(ex.Slot({from: (d) => d.children})($.h1()("Hello, World!"))));
    const App = ex.component(Div());
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<div><h1>Hello, World!</h1></div>`);
  });
});

test("Slot should render named slot", () => {
  withContainer((el) => {
    const Layout = ex.component(
      ex.reactive().prop("header").prop("body").prop("footer"),
      $.div()(
        $.div()(ex.Slot({from: (d) => d.header})),
        $.div()(ex.Slot({from: (d) => d.body})),
        $.div()(ex.Slot({from: (d) => d.footer})),
      ),
    );
    const App = ex.component(
      Layout({
        header: $.h1()("Header"),
        body: $.p()("Body"),
        footer: $.h2()("Footer"),
      }),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<div><div><h1>Header</h1></div><div><p>Body</p></div><div><h2>Footer</h2></div></div>`);
  });
});
