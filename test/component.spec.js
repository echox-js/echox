import Echo, {X} from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";

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

test("component should use state for attribute.", () => {
  withContainer((el) => {
    const App = Echo.component(
      X.p({class: "test", style: (d) => d.style})("Hello World!"),
      Echo.reactive()
        .state("style", () => "color: red")
        .state("className", () => "test"),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<p class="test" style="color: red;">Hello World!</p>`);
  });
});

test("component should use state for text nodes.", () => {
  withContainer((el) => {
    const App = Echo.component(
      X.p()((d) => d.test),
      Echo.reactive().state("test", () => "hello world"),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<p>hello world</p>`);
  });
});

test("component should use state for child component props.", () => {
  withContainer((el) => {
    const Hello = Echo.component(X.p({style: (d) => d.style})("Hello World!"), Echo.reactive().prop("style"));
    const App = Echo.component(
      Hello({style: (d) => d.style}),
      Echo.reactive().state("style", () => "color: blue"),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<p style="color: blue;">Hello World!</p>`);
  });
});

test("component should pass props.", () => {
  withContainer((el) => {
    const Hello = Echo.component(
      X.p({style: (d) => d.style})("Hello World!"),
      Echo.reactive().prop("style", () => "color: red"),
    );
    const App = Echo.component(X.div()(Hello({style: "color: blue"}), Hello()));
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(
      `<div><p style="color: blue;">Hello World!</p><p style="color: red;">Hello World!</p></div>`,
    );
  });
});

test("component should only use defined props.", () => {
  withContainer((el) => {
    const Hello = Echo.component(X.p({style: (d) => d.style})("Hello World!"));
    const App = Echo.component(X.div()(Hello({style: "color: blue"})));
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<div><p style="">Hello World!</p></div>`);
  });
});
