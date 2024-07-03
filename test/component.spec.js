import Echo, {X} from "echox";
import {test, expect, vi} from "vitest";
import {withContainer} from "./container.js";
import {sleep} from "./sleep.js";

test("component should store template in tag.", () => {
  const div = X.div()("hello world");
  const Div = Echo.component(div);
  const app = Div();
  expect(app.tag[1]).toBe(div);
});

test("component should construct nested structure.", () => {
  const Div = Echo.component(X.div());
  const App = Echo.component(Div()(X.h1()("Hello, World!"), Div()(X.p()("This is a test."))));
  const app = App();
  expect(app.tag[1].children[1].children[0].children[0]).toBe("This is a test.");
});

test("component should use state for attribute.", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive()
        .state("style", () => "color: red")
        .state("className", () => "test"),
      X.p({class: "test", style: (d) => d.style})("Hello World!"),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<p class="test" style="color: red;">Hello World!</p>`);
  });
});

test("component should use state for text nodes.", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("test", () => "hello world"),
      X.p()((d) => d.test),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<p>hello world</p>`);
  });
});

test("component should use state for child component props.", () => {
  withContainer((el) => {
    const Hello = Echo.component(Echo.reactive().prop("style"), X.p({style: (d) => d.style})("Hello World!"));
    const App = Echo.component(
      Echo.reactive().state("style", () => "color: blue"),
      Hello({style: (d) => d.style}),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<p style="color: blue;">Hello World!</p>`);
  });
});

test("component should pass props.", () => {
  withContainer((el) => {
    const Hello = Echo.component(
      Echo.reactive().prop("style", () => "color: red"),
      X.p({style: (d) => d.style})("Hello World!"),
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

test("component should bind state to attribute.", async () => {
  await withContainer(async (el) => {
    const style = vi.fn((d) => `background:${d.color}`);
    const color = vi.fn(() => "red");
    const App = Echo.component(
      Echo.reactive().state("color", color),
      Echo.Fragment()(
        X.input({
          oninput: (d) => (e) => (d.color = e.target.value),
          value: (d) => d.color,
        }),
        X.p({style})("Hello World!"),
      ),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<input><p style="background: red;">Hello World!</p>`);
    expect(style.mock.calls.length).toBe(1);
    expect(color.mock.calls.length).toBe(1);

    const input = el.querySelector("input");
    input.value = "blue";
    input.dispatchEvent(new Event("input"));
    expect(style.mock.calls.length).toBe(1);

    await sleep();
    expect(style.mock.calls.length).toBe(2);
    expect(color.mock.calls.length).toBe(1);
    expect(el.innerHTML).toBe(`<input><p style="background: blue;">Hello World!</p>`);
  });
});

test("component should not computed unbind state.", async () => {
  await withContainer(async (el) => {
    const color = vi.fn(() => "red");
    const App = Echo.component(Echo.reactive().state("color", color), X.h1()("hello world"));
    Echo.mount(el, App());
    expect(color.mock.calls.length).toBe(0);

    await sleep();
    expect(color.mock.calls.length).toBe(0);
  });
});

test("component should only compute state once for multiple binds.", async () => {
  await withContainer(async (el) => {
    const className = vi.fn(() => "test");
    const App = Echo.component(
      Echo.reactive().state("class", className),
      Echo.Fragment()(X.h1({class: (d) => d.class})("hello"), X.h1({class: (d) => d.class})("world")),
    );
    Echo.mount(el, App());
    expect(className.mock.calls.length).toBe(1);

    await sleep();
    expect(className.mock.calls.length).toBe(1);
  });
});

test("component should compute derived state.", async () => {
  await withContainer(async (el) => {
    const message = vi.fn(() => "test");
    const reversed = vi.fn((d) => d.message.split("").reverse().join(""));
    const App = Echo.component(
      Echo.reactive().state("message", message).state("reversed", reversed),
      Echo.Fragment()(X.h1({class: (d) => d.message})("hello"), X.h1({class: (d) => d.reversed})("world")),
    );
    Echo.mount(el, App());
    expect(message.mock.calls.length).toBe(1);
    expect(reversed.mock.calls.length).toBe(1);
    expect(el.innerHTML).toBe(`<h1 class="test">hello</h1><h1 class="tset">world</h1>`);
  });
});

test("component should not compute derived state when not used.", async () => {
  await withContainer(async (el) => {
    const message = vi.fn(() => "test");
    const reversed = vi.fn((d) => d.message.split("").reverse().join(""));
    const App = Echo.component(
      Echo.reactive().state("message", message).state("reversed", reversed),
      X.h1({class: (d) => d.message})("hello"),
    );
    Echo.mount(el, App());
    expect(message.mock.calls.length).toBe(1);
    expect(reversed.mock.calls.length).toBe(0);
  });
});

test("component should update derived state.", async () => {
  await withContainer(async (el) => {
    const message = vi.fn(() => "test");
    const reversed = vi.fn((d) => d.message.split("").reverse().join(""));
    const App = Echo.component(
      Echo.reactive().state("message", message).state("reversed", reversed),
      Echo.Fragment()(
        X.input({
          oninput: (d) => (e) => (d.message = e.target.value),
          value: (d) => d.message,
        }),
        X.h1({class: (d) => d.reversed})("hello"),
      ),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<input><h1 class="tset">hello</h1>`);
    expect(message.mock.calls.length).toBe(1);
    expect(reversed.mock.calls.length).toBe(1);

    const input = el.querySelector("input");
    input.value = "world";
    input.dispatchEvent(new Event("input"));
    expect(message.mock.calls.length).toBe(1);
    expect(reversed.mock.calls.length).toBe(1);

    await sleep();
    expect(message.mock.calls.length).toBe(1);
    expect(reversed.mock.calls.length).toBe(2);
    expect(el.innerHTML).toBe(`<input><h1 class="dlrow">hello</h1>`);
  });
});
