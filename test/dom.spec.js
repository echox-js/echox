import {test, expect, describe} from "vitest";
import {HTML, reactive, set} from "../src/index.js";
import {sleep} from "./sleep.js";

describe("DOM", () => {
  test("tag([props], children) should create specified element.", () => {
    const dom = HTML.div({id: "hello"}, ["Hello, world!", HTML.button(["Click me!"]), HTML.span()]);
    expect(dom.outerHTML).toBe(`<div id="hello">Hello, world!<button>Click me!</button><span></span></div>`);
  });

  test("tag([props], children) should create specified element with styles.", () => {
    const dom = HTML.div({id: "hello", style: {color: "red", fontSize: "100px"}});
    expect(dom.outerHTML).toBe(`<div id="hello" style="color: red; font-size: 100px;"></div>`);
    expect(dom.style.color).toBe("red");
    expect(dom.style.fontSize).toBe("100px");
  });

  test("set(dom, [props], children) should update specified element.", () => {
    const dom = HTML.div();
    set(dom, {id: "hello"}, ["Hello, world!", HTML.button(["Click me!"]), HTML.span()]);
    expect(dom.outerHTML).toBe(`<div id="hello">Hello, world!<button>Click me!</button><span></span></div>`);
  });

  test("tag([props], children) should create specified SVG element.", () => {
    const svg = HTML("http://www.w3.org/2000/svg");
    const dom = svg.circle({cx: 50, cy: 50, r: 40});
    expect(dom.outerHTML).toBe(`<circle cx="50" cy="50" r="40"></circle>`);
  });

  test("tag([props], children) should handle falsy values in children.", () => {
    const dom = HTML.div([null, undefined, false, 0, "text"]);
    expect(dom.outerHTML).toBe(`<div>0text</div>`);
  });

  test("tag([props], children) should specified innerHTML.", () => {
    const dom = HTML.div({innerHTML: "<b>Hello, world!</b>"});
    expect(dom.outerHTML).toBe(`<div><b>Hello, world!</b></div>`);
  });

  test("tag([props], children) should specified textContent.", () => {
    const dom = HTML.div({textContent: "Hello, World!"});
    expect(dom.outerHTML).toBe(`<div>Hello, World!</div>`);
  });

  test("tag([props], children) should specified event listeners.", () => {
    let clicked = false;
    const dom = HTML.button({onclick: () => (clicked = true)});
    dom.click();
    expect(clicked).toBe(true);
  });

  test("tag([props], children) should update reactive nodes' attributes.", async () => {
    const [state] = reactive().state("name", "John").join();
    const dom = HTML.div({id: () => state.name});
    document.body.append(dom);

    expect(dom.outerHTML).toBe(`<div id="John"></div>`);

    state.name = "Doe";
    await sleep(0);
    expect(dom.outerHTML).toBe(`<div id="Doe"></div>`);

    document.body.removeChild(dom);
  });

  test("tag([props], children) should update reactive nodes' styles.", async () => {
    const [state] = reactive().state("color", "red").join();
    const dom = HTML.div({style: {color: () => state.color, fontSize: "100px"}});
    document.body.append(dom);

    expect(dom.outerHTML).toBe(`<div style="color: red; font-size: 100px;"></div>`);

    state.color = "blue";

    await sleep(0);
    expect(dom.outerHTML).toBe(`<div style="color: blue; font-size: 100px;"></div>`);

    document.body.removeChild(dom);
  });

  test("tag(props, children) should update reactive number children.", async () => {
    const [state] = reactive().state("count", 0).join();
    const span = HTML.span([() => state.count]);
    document.body.append(span);

    state.count = 1;
    await sleep(0);
    expect(span.outerHTML).toBe(`<span>1</span>`);

    document.body.removeChild(span);
  });

  test("tag(props, children) should update reactive string children.", async () => {
    const [state] = reactive().state("name", "John").join();
    const span = HTML.span([() => state.name]);
    document.body.append(span);

    state.name = "Doe";

    await sleep(0);
    expect(span.outerHTML).toBe(`<span>Doe</span>`);

    document.body.removeChild(span);
  });

  test("tag(props, children) should update reactive DOM children.", async () => {
    const [state] = reactive().state("show", true).join();
    const div = HTML.div([() => (state.show ? HTML.span(["Hello"]) : null)]);
    document.body.append(div);

    state.show = false;

    await sleep(0);
    expect(div.outerHTML).toBe(`<div></div>`);

    state.show = true;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Hello</span></div>`);

    document.body.removeChild(div);
  });

  test("tag(props, children) should update multiple reactive DOM children.", async () => {
    const [state] = reactive().state("count", 0).state("name", "John").join();
    const div = HTML.div([() => state.count, () => state.name]);
    document.body.append(div);

    state.count++;
    state.name = "Doe";

    await sleep(0);
    expect(div.outerHTML).toBe(`<div>1Doe</div>`);

    document.body.removeChild(div);
  });

  test("tag(props, children) should update mixed static and reactive children.", async () => {
    const [state] = reactive().state("show", true).join();
    const div = HTML.div([
      HTML.span(["Static"]),
      () => (state.show ? HTML.span(["Dynamic"]) : null),
      HTML.span(["Static2"]),
    ]);
    document.body.append(div);

    expect(div.outerHTML).toBe(`<div><span>Static</span><span>Dynamic</span><span>Static2</span></div>`);

    state.show = false;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Static</span><span>Static2</span></div>`);

    state.show = true;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Static</span><span>Dynamic</span><span>Static2</span></div>`);

    document.body.removeChild(div);
  });

  test("tag(props, children) should update multiple mixed static and reactive children.", async () => {
    const [state] = reactive().state("show", true).state("show2", true).join();
    const div = HTML.div([
      HTML.span(["Static"]),
      () => (state.show ? HTML.span(["Dynamic"]) : null),
      () => (state.show2 ? HTML.span(["Dynamic2"]) : null),
      HTML.span(["Static2"]),
    ]);
    document.body.append(div);

    expect(div.outerHTML).toBe(
      `<div><span>Static</span><span>Dynamic</span><span>Dynamic2</span><span>Static2</span></div>`,
    );

    state.show = false;
    state.show2 = false;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Static</span><span>Static2</span></div>`);

    state.show = true;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Static</span><span>Dynamic</span><span>Static2</span></div>`);

    state.show2 = true;
    await sleep(0);
    expect(div.outerHTML).toBe(
      `<div><span>Static</span><span>Dynamic</span><span>Dynamic2</span><span>Static2</span></div>`,
    );

    document.body.removeChild(div);
  });

  test("tag(props, children) should update nodes when children change.", async () => {
    const [state] = reactive().state("items", [1, 2, 3]).join();
    const list = HTML.div([() => state.items.map((i) => HTML.span([i]))]);
    document.body.append(list);

    expect(list.outerHTML).toBe(`<div><span>1</span><span>2</span><span>3</span></div>`);

    state.items = [2, 3, 4];
    await sleep(0);
    expect(list.outerHTML).toBe(`<div><span>2</span><span>3</span><span>4</span></div>`);

    document.body.removeChild(list);
  });

  test("tag(props, children) should handle nested reactive updates.", async () => {
    const [state] = reactive().state("show", true).state("items", ["a", "b"]).join();

    const div = HTML.div([() => (state.show ? state.items.map((item) => HTML.span([item])) : null)]);
    document.body.append(div);

    expect(div.outerHTML).toBe(`<div><span>a</span><span>b</span></div>`);

    state.items = ["c", "d", "e"];
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>c</span><span>d</span><span>e</span></div>`);

    state.show = false;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div></div>`);

    document.body.removeChild(div);
  });

  test("tag(props, children) should handle array updates with different lengths", async () => {
    const [state] = reactive().state("items", [1, 2]).join();
    const list = HTML.div([() => state.items.map((i) => HTML.span([i]))]);
    document.body.append(list);

    expect(list.outerHTML).toBe(`<div><span>1</span><span>2</span></div>`);

    state.items = [3, 4, 5, 6];
    await sleep(0);
    expect(list.outerHTML).toBe(`<div><span>3</span><span>4</span><span>5</span><span>6</span></div>`);

    state.items = [7];
    await sleep(0);
    expect(list.outerHTML).toBe(`<div><span>7</span></div>`);

    document.body.removeChild(list);
  });
});
