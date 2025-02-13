import {test, expect, describe} from "vitest";
import {html, reactive} from "../src/index.js";
import {sleep} from "./sleep.js";

describe("DOM", () => {
  test("tag([props], children) should create specified element.", () => {
    const dom = html.div({id: "hello"}, ["Hello, world!", html.button(["Click me!"]), html.span()]);
    expect(dom.outerHTML).toBe(`<div id="hello">Hello, world!<button>Click me!</button><span></span></div>`);
  });

  test("tag([props], children) should create specified SVG element.", () => {
    const svg = html("http://www.w3.org/2000/svg");
    const dom = svg.circle({cx: 50, cy: 50, r: 40});
    expect(dom.outerHTML).toBe(`<circle cx="50" cy="50" r="40"></circle>`);
  });

  test("tag([props], children) should handle falsy values in children.", () => {
    const dom = html.div([null, undefined, false, 0, "text"]);
    expect(dom.outerHTML).toBe(`<div>0text</div>`);
  });

  test("tag([props], children) should specified innerHTML.", () => {
    const dom = html.div({innerHTML: "<b>Hello, world!</b>"});
    expect(dom.outerHTML).toBe(`<div><b>Hello, world!</b></div>`);
  });

  test("tag([props], children) should specified textContent.", () => {
    const dom = html.div({textContent: "Hello, World!"});
    expect(dom.outerHTML).toBe(`<div>Hello, World!</div>`);
  });

  test("tag([props], children) should specified event listeners.", () => {
    let clicked = false;
    const dom = html.button({onclick: () => (clicked = true)});
    dom.click();
    expect(clicked).toBe(true);
  });

  test("tag([props], children) should update reactive nodes' attributes.", async () => {
    const state = reactive().state("name", "John").join();
    const dom = html.div({id: state.select("name")});
    document.body.append(dom);

    expect(dom.outerHTML).toBe(`<div id="John"></div>`);

    state.name = "Doe";
    await sleep(0);
    expect(dom.outerHTML).toBe(`<div id="Doe"></div>`);

    document.body.removeChild(dom);
  });

  test("tag(props, children) should remove old reactive event listener when updating.", async () => {
    const state = reactive()
      .state("count", 0)
      .state("handler", () => state.count++)
      .join();

    const button = html.button({
      onclick: state.select("handler"),
    });
    document.body.append(button);

    button.click();
    expect(state.count).toBe(1);

    state.handler = () => (state.count += 2);
    await sleep(0);

    button.click();
    expect(state.count).toBe(3);

    document.body.removeChild(button);
  });

  test("tag(props, children) should update reactive number children.", async () => {
    const state = reactive().state("count", 0).join();
    const span = html.span([state.select("count")]);
    document.body.append(span);

    state.count = 1;
    await sleep(0);
    expect(span.outerHTML).toBe(`<span>1</span>`);

    document.body.removeChild(span);
  });

  test("tag(props, children) should update reactive string children.", async () => {
    const state = reactive().state("name", "John").join();
    const span = html.span([state.select("name")]);
    document.body.append(span);

    state.name = "Doe";

    await sleep(0);
    expect(span.outerHTML).toBe(`<span>Doe</span>`);

    document.body.removeChild(span);
  });

  test("tag(props, children) should update reactive DOM children.", async () => {
    const state = reactive().state("show", true).join();
    const div = html.div([state.select((d) => (d.show ? html.span(["Hello"]) : null))]);
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
    const state = reactive().state("count", 0).state("name", "John").join();
    const div = html.div([state.select("count"), state.select("name")]);
    document.body.append(div);

    state.count++;
    state.name = "Doe";

    await sleep(0);
    expect(div.outerHTML).toBe(`<div>1Doe</div>`);

    document.body.removeChild(div);
  });

  test("tag(props, children) should update mixed static and reactive children.", async () => {
    const state = reactive().state("show", true).join();
    const div = html.div([
      html.span(["Static"]),
      state.select((d) => (d.show ? html.span(["Dynamic"]) : null)),
      html.span(["Static2"]),
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
    const state = reactive().state("show", true).state("show2", true).join();
    const div = html.div([
      html.span(["Static"]),
      state.select((d) => (d.show ? html.span(["Dynamic"]) : null)),
      state.select((d) => (d.show2 ? html.span(["Dynamic2"]) : null)),
      html.span(["Static2"]),
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
    const state = reactive().state("items", [1, 2, 3]).join();
    const list = html.div([state.map("items", (i) => html.span([i]))]);
    document.body.append(list);

    expect(list.outerHTML).toBe(`<div><span>1</span><span>2</span><span>3</span></div>`);

    state.items = [2, 3, 4];
    await sleep(0);
    expect(list.outerHTML).toBe(`<div><span>2</span><span>3</span><span>4</span></div>`);

    document.body.removeChild(list);
  });

  test("tag(props, children) should handle nested reactive updates.", async () => {
    const state = reactive().state("show", true).state("items", ["a", "b"]).join();

    // TODO: Test with select.map.
    const div = html.div([state.select((d) => (d.show ? d.items.map((item) => html.span([item])) : null))]);
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
    const state = reactive().state("items", [1, 2]).join();
    const list = html.div([state.map("items", (i) => html.span([i]))]);
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
