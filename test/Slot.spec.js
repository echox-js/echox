import * as EchoX from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";

const {html} = EchoX;

test("Slot should render children", () => {
  withContainer((el) => {
    const Div = EchoX.component(html.div()(EchoX.Slot({from: (d) => d.children})));
    const App = EchoX.component(Div()(html.h1()("Hello, World!"), Div()(html.p()("This is a test."))));
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<div><h1>Hello, World!</h1><div><p>This is a test.</p></div></div>`);
  });
});

test("Slot should render default slot", () => {
  withContainer((el) => {
    const Div = EchoX.component(html.div()(EchoX.Slot({from: (d) => d.children})(html.h1()("Hello, World!"))));
    const App = EchoX.component(Div());
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<div><h1>Hello, World!</h1></div>`);
  });
});

test("Slot should render named slot", () => {
  withContainer((el) => {
    const Layout = EchoX.component(
      EchoX.reactive().prop("header").prop("body").prop("footer"),
      html.div()(
        html.div()(EchoX.Slot({from: (d) => d.header})),
        html.div()(EchoX.Slot({from: (d) => d.body})),
        html.div()(EchoX.Slot({from: (d) => d.footer})),
      ),
    );
    const App = EchoX.component(
      Layout({
        header: html.h1()("Header"),
        body: html.p()("Body"),
        footer: html.h2()("Footer"),
      }),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<div><div><h1>Header</h1></div><div><p>Body</p></div><div><h2>Footer</h2></div></div>`);
  });
});
