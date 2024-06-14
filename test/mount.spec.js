import Echo, {X} from "echox";
import {test, expect, vi} from "vitest";

function container() {
  const div = document.createElement("div");
  document.body.appendChild(div);
  return div;
}

test("mount(component) should render HTML template.", () => {
  const el = container();
  const App = Echo.component(X.div({id: "app"})(X.h1()("Hello, World!"), X.p()("This is a test."), X.span()));
  Echo.mount(el, App());
  expect(el.innerHTML).toBe(`<div id="app"><h1>Hello, World!</h1><p>This is a test.</p><span></span></div>`);
  el.remove();
});

test("mount(component) should render SVG template.", () => {
  const el = container();
  const ns = "http://www.w3.org/2000/svg";
  const svg = X(ns);
  const App = Echo.component(svg.circle({id: "test"})(svg.title()("Test")));
  Echo.mount(el, App());
  expect(el.innerHTML).toBe(`<circle id="test"><title>Test</title></circle>`);
  el.remove();
});

test("mount(component) should render string.", () => {
  const el = container();
  const App = Echo.component("Hello, World!");
  Echo.mount(el, App());
  expect(el.innerHTML).toBe(`Hello, World!`);
  el.remove();
});

test("mount(component) should render HTML template with event listener.", () => {
  const el = container();
  const $click = vi.fn();
  const App = Echo.component(X.button({$click})("Click me!"));
  Echo.mount(el, App());
  el.querySelector("button").click();
  expect($click).toHaveBeenCalledTimes(1);
  expect($click).toHaveBeenCalledWith(expect.any(MouseEvent));
  expect(el.innerHTML).toBe(`<button>Click me!</button>`);
  el.remove();
});

test("mount(component) should support innerHTML props.", () => {
  const el = container();
  const App = Echo.component(X.div({innerHTML: "<h1>Hello, World!</h1>"}));
  Echo.mount(el, App());
  expect(el.innerHTML).toBe(`<div><h1>Hello, World!</h1></div>`);
  el.remove();
});

test("mount(component) should support boolean props.", () => {
  const el = container();
  const App = Echo.component(X.div()(X.input({disabled: true}), X.input({disabled: false})));
  Echo.mount(el, App());
  // In browser, it should be <input disabled> instead of <input disabled="">
  expect(el.innerHTML).toBe(`<div><input disabled=""><input></div>`);
  el.remove();
});
