import Echo, {X} from "echox";
import {test, expect, vi} from "vitest";
import {withContainer} from "./container.js";

test("mount(component) should render HTML template.", () => {
  withContainer((el) => {
    const App = Echo.component(X.div({id: "app"})(X.h1()("Hello, World!"), X.p()("This is a test."), X.span()));
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<div id="app"><h1>Hello, World!</h1><p>This is a test.</p><span></span></div>`);
  });
});

test("mount(component) should render SVG template.", () => {
  withContainer((el) => {
    const ns = "http://www.w3.org/2000/svg";
    const svg = X(ns);
    const App = Echo.component(svg.circle({id: "test"})(svg.title()("Test")));
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<circle id="test"><title>Test</title></circle>`);
  });
});

test("mount(component) should render string.", () => {
  withContainer((el) => {
    const App = Echo.component("Hello, World!");
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`Hello, World!`);
  });
});

test("mount(component) should render HTML template with event listener.", () => {
  withContainer((el) => {
    const $click = vi.fn();
    const App = Echo.component(X.button({$click})("Click me!"));
    Echo.mount(el, App());
    el.querySelector("button").click();
    expect($click).toHaveBeenCalledTimes(1);
    expect($click).toHaveBeenCalledWith(expect.any(MouseEvent));
    expect(el.innerHTML).toBe(`<button>Click me!</button>`);
  });
});

test("mount(component) should support innerHTML props.", () => {
  withContainer((el) => {
    const App = Echo.component(X.div({innerHTML: "<h1>Hello, World!</h1>"}));
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<div><h1>Hello, World!</h1></div>`);
  });
});

test("mount(component) should support boolean props.", () => {
  withContainer((el) => {
    const App = Echo.component(X.div()(X.input({disabled: true}), X.input({disabled: false})));
    Echo.mount(el, App());
    // In browser, it should be <input disabled> instead of <input disabled="">
    expect(el.innerHTML).toBe(`<div><input disabled=""><input></div>`);
  });
});
