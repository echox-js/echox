import Echo, {X} from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";

test("Slot should render children", () => {
  withContainer((el) => {
    const Div = Echo.component(X.div()(Echo.Slot()));
    const App = Echo.component(Div()(X.h1()("Hello, World!"), Div()(X.p()("This is a test."))));
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<div><h1>Hello, World!</h1><div><p>This is a test.</p></div></div>`);
  });
});

test("Slot should render default slot", () => {
  withContainer((el) => {
    const Div = Echo.component(X.div()(Echo.Slot()(X.h1()("Hello, World!"))));
    const App = Echo.component(Div());
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<div><h1>Hello, World!</h1></div>`);
  });
});

test("Slot should render named slot", () => {
  withContainer((el) => {
    const Layout = Echo.component(
      Echo.reactive().prop("header").prop("body").prop("footer"),
      X.div()(
        X.div()(Echo.Slot({from: (d) => d.header})),
        X.div()(Echo.Slot({from: (d) => d.body})),
        X.div()(Echo.Slot({from: (d) => d.footer})),
      ),
    );
    const App = Echo.component(
      Layout({
        header: X.h1()("Header"),
        body: X.p()("Body"),
        footer: X.h2()("Footer"),
      }),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<div><div><h1>Header</h1></div><div><p>Body</p></div><div><h2>Footer</h2></div></div>`);
  });
});
