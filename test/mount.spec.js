import * as EchoX from "echox";
import {test, expect, vi} from "vitest";
import {withContainer} from "./container.js";

const {html} = EchoX;

test("mount(container, component) should render HTML template.", () => {
  withContainer((el) => {
    const App = EchoX.component(
      html.div({id: "app"})(html.h1()("Hello, World!"), html.p()("This is a test."), html.span()),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<div id="app"><h1>Hello, World!</h1><p>This is a test.</p><span></span></div>`);
  });
});

test("mount(container, component) should render SVG template.", () => {
  withContainer((el) => {
    const ns = "http://www.w3.org/2000/svg";
    const svg = html(ns);
    const App = EchoX.component(svg.circle({id: "test"})(svg.title()("Test")));
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<circle id="test"><title>Test</title></circle>`);
  });
});

test("mount(container, component) should render string.", () => {
  withContainer((el) => {
    const App = EchoX.component("Hello, World!");
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`Hello, World!`);
  });
});

test("mount(container, component) should render HTML template with event listener.", () => {
  withContainer((el) => {
    const onclick = vi.fn();
    const attr = vi.fn(() => onclick);
    const App = EchoX.component(html.button({onclick: attr})("Click me!"));
    EchoX.mount(el, App());
    el.querySelector("button").click();
    expect(onclick).toHaveBeenCalledTimes(1);
    expect(attr).toHaveBeenCalledTimes(1);
    expect(attr).toHaveBeenCalledWith(expect.any(Object));
    expect(onclick).toHaveBeenCalledWith(expect.any(MouseEvent));
    expect(el.innerHTML).toBe(`<button>Click me!</button>`);
  });
});

test("mount(container, component) should support innerHTML props.", () => {
  withContainer((el) => {
    const App = EchoX.component(html.div({innerHTML: "<h1>Hello, World!</h1>"}));
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<div><h1>Hello, World!</h1></div>`);
  });
});

test("mount(container, component) should support boolean props.", () => {
  withContainer((el) => {
    const App = EchoX.component(html.div()(html.input({disabled: true}), html.input({disabled: false})));
    EchoX.mount(el, App());
    // In browser, it should be <input disabled> instead of <input disabled="">
    expect(el.innerHTML).toBe(`<div><input disabled=""><input></div>`);
  });
});
