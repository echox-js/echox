import {test, expect, describe} from "vitest";
import {html, reactive, $} from "../src/index.js";
import {sleep} from "./sleep.js";

describe("template", () => {
  test("html.[element]([props],children) should create specified element.", () => {
    const dom = html.div({id: "hello"}, ["Hello, world!", html.button("Click me!"), html.span()]);
    expect(dom.outerHTML).toBe(`<div id="hello">Hello, world!<button>Click me!</button><span></span></div>`);
  });

  test("html.[element](props) should specified innerHTML.", () => {
    const dom = html.div({innerHTML: "<b>Hello, world!</b>"});
    expect(dom.outerHTML).toBe(`<div><b>Hello, world!</b></div>`);
  });

  test("html.[element](props) should specified textContent.", () => {
    const dom = html.div({textContent: "Hello, World!"});
    expect(dom.outerHTML).toBe(`<div>Hello, World!</div>`);
  });

  test("html.[element](props) should specified event listeners.", () => {
    let clicked = false;
    const dom = html.button({onclick: () => (clicked = true)});
    dom.click();
    expect(clicked).toBe(true);
  });

  test("html.[element](props) should $ reactive state to attributes.", async () => {
    const [scope] = reactive().let("name", "John").join();
    const dom = html.div({id: $(() => scope.name)});
    expect(dom.outerHTML).toBe(`<div id="John"></div>`);

    scope.name = "Doe";
    await sleep(0);
    expect(dom.outerHTML).toBe(`<div id="Doe"></div>`);
  });

  test("html.[element](props) should $ reactive state to event listeners.", async () => {
    const [scope] = reactive().let("clicked", true).let("count", 0).join();
    const increment = () => scope.count++;
    const decrement = () => scope.count--;

    let counter;
    let checked;

    const dom = html.div([
      (counter = html.button(
        {
          onclick: $(() => (scope.clicked ? increment : decrement)),
        },
        [$(() => scope.count)],
      )),
      (checked = html.button({
        onclick: () => (scope.clicked = !scope.clicked),
      })),
    ]);

    document.body.append(dom);

    counter.click();
    await sleep(0);
    expect(counter.outerHTML).toBe(`<button>1</button>`);

    checked.click();
    await sleep(0);
    counter.click();
    await sleep(0);
    expect(counter.outerHTML).toBe(`<button>0</button>`);
  });

  test("html.[element](props, children) should $ reactive state to number children", async () => {
    const [scope] = reactive().let("count", 0).join();
    const button = html.button({onclick: () => scope.count++}, [$(() => scope.count)]);
    document.body.append(button);

    button.click();

    await sleep(0);
    expect(button.outerHTML).toBe(`<button>1</button>`);

    document.body.removeChild(button);
  });

  test("html.[element](props, children) should $ reactive state to string children", async () => {
    const [scope] = reactive().let("name", "John").join();
    const div = html.div([$(() => scope.name)]);
    document.body.append(div);

    scope.name = "Doe";

    await sleep(0);
    expect(div.outerHTML).toBe(`<div>Doe</div>`);

    document.body.removeChild(div);
  });

  test("html.[element](props, children) should $ reactive state to element children", async () => {
    const [scope] = reactive().let("show", true).join();
    const div = html.div([$(() => (scope.show ? html.span(["Hello"]) : null))]);
    document.body.append(div);

    scope.show = false;

    await sleep(0);
    expect(div.outerHTML).toBe(`<div></div>`);

    scope.show = true;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Hello</span></div>`);

    document.body.removeChild(div);
  });

  test("html.[element](props, children) should $ reactive state to multiple children", async () => {
    const [scope] = reactive().let("count", 0).let("name", "John").join();
    const div = html.div([$(() => scope.count), $(() => scope.name)]);
    document.body.append(div);

    scope.count++;
    scope.name = "Doe";

    await sleep(0);
    expect(div.outerHTML).toBe(`<div>1Doe</div>`);

    document.body.removeChild(div);
  });
});
