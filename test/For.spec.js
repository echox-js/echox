import * as EchoX from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";
import {sleep} from "./sleep.js";
import {createPromise} from "./promise.js";

const {html} = EchoX;

test("For should render list children", async () => {
  await withContainer((el) => {
    const App = EchoX.component(EchoX.For({each: [1, 2, 3]})(html.h1()("Hello, World!")));
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1><h1>Hello, World!</h1><h1>Hello, World!</h1>`);
  });
});

test("For should render list state children", async () => {
  await withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().let("list", () => [1, 2, 3]),
      EchoX.For({each: (d) => d.list})(html.h1()("Hello, World!")),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1><h1>Hello, World!</h1><h1>Hello, World!</h1>`);
  });
});

test("For should render list children with value and index", async () => {
  await withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().let("test", () => "A"),
      EchoX.For({each: [1, 2, 3]})(html.h1()((d, item) => d.test + item.val + item.index)),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>A10</h1><h1>A21</h1><h1>A32</h1>`);
  });
});

test("For should render list state children with value and index", async () => {
  await withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive()
        .let("test", () => "A")
        .let("list", () => [1, 2, 3]),
      EchoX.For({each: (d) => d.list})(html.h1()((d, item) => d.test + item.val + item.index)),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>A10</h1><h1>A21</h1><h1>A32</h1>`);
  });
});

test("For should render nested list children with value and index", async () => {
  await withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().let("test", () => "A"),
      EchoX.For({each: [1, 2, 3]})(
        EchoX.For({each: [1, 2]})(
          html.h1()((d, x1, x2) => {
            return d.test + x1.val + x1.index + x2.val + x2.index;
          }),
        ),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>A1010</h1><h1>A1021</h1><h1>A2110</h1><h1>A2121</h1><h1>A3210</h1><h1>A3221</h1>`);
  });
});

test("For should render nested list state children with value and index", async () => {
  await withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().let("list", () => [
        {text: "A", list: [1, 2]},
        {text: "B", list: [3, 4]},
      ]),
      EchoX.For({each: (d) => d.list})(
        EchoX.For({each: ($, x1) => x1.val.list})(
          html.h1()((d, x1, x2) => {
            return x1.val.text + x1.index + x2.val + x2.index;
          }),
        ),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>A010</h1><h1>A021</h1><h1>B130</h1><h1>B141</h1>`);
  });
});

test("For and Match should work together", async () => {
  await withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().let("list", () => [1, 2, 3]),
      EchoX.For({each: (d) => d.list})(
        EchoX.Match({value: (d, list) => list.val})(
          EchoX.Arm({test: 1})(html.h1()("One")),
          EchoX.Arm({test: 2})(html.h1()("Two")),
          EchoX.Arm({test: 3})(html.h1()("Three")),
        ),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>One</h1><h1>Two</h1><h1>Three</h1>`);
  });
});

test("For should render reactive list children", async () => {
  await withContainer(async (el) => {
    const App = EchoX.component(
      EchoX.reactive().let("list", () => [1, 2, 3]),
      EchoX.Fragment()(
        html.button({
          onclick: (d) => () => {
            d.list.pop();
            d.list.reverse();
            d.list.push(4);
            d.list = [...d.list];
          },
        })("change"),
        EchoX.For({each: (d) => d.list})(html.span()((d, item) => item.index + "," + item.val)),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<button>change</button><span>0,1</span><span>1,2</span><span>2,3</span>`);

    const button = el.querySelector("button");
    const [span01, span12] = el.getElementsByTagName("span");
    button.click();
    await sleep();

    expect(el.innerHTML).toBe(`<button>change</button><span>0,2</span><span>1,1</span><span>2,4</span>`);
    const [span02, span11] = el.getElementsByTagName("span");
    expect(span01).toBe(span11);
    expect(span12).toBe(span02);

    button.click();
    await sleep();

    expect(el.innerHTML).toBe(`<button>change</button><span>0,1</span><span>1,2</span><span>2,4</span>`);
  });
});

test("For should append elements", async () => {
  await withContainer(async (el) => {
    const App = EchoX.component(
      EchoX.reactive().let("list", () => [1, 2, 3]),
      EchoX.Fragment()(
        html.button({
          onclick: (d) => () => {
            d.list.push(4);
            d.list = [...d.list];
          },
        })("change"),
        EchoX.For({each: (d) => d.list})(html.span()((d, item) => item.index + "," + item.val)),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<button>change</button><span>0,1</span><span>1,2</span><span>2,3</span>`);

    const button = el.querySelector("button");
    const [span0, span1, span2] = el.getElementsByTagName("span");
    button.click();
    await sleep();

    const [span01, span11, span21] = el.getElementsByTagName("span");
    expect(el.innerHTML).toBe(
      `<button>change</button><span>0,1</span><span>1,2</span><span>2,3</span><span>3,4</span>`,
    );
    expect(span0).toBe(span01);
    expect(span1).toBe(span11);
    expect(span2).toBe(span21);
  });
});

test("For should remove elements", async () => {
  await withContainer(async (el) => {
    const App = EchoX.component(
      EchoX.reactive().let("list", () => [1, 2, 3]),
      EchoX.Fragment()(
        html.button({
          onclick: (d) => () => {
            d.list.shift();
            d.list = [...d.list];
          },
        })("change"),
        EchoX.For({each: (d) => d.list})(html.span()((d, item) => item.index + "," + item.val)),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<button>change</button><span>0,1</span><span>1,2</span><span>2,3</span>`);

    const [promise, resolve] = createPromise();
    const observer = new MutationObserver((mutations) => {
      expect(mutations[0].removedNodes.length).toBe(1);
      expect(mutations[0].addedNodes.length).toBe(0);
      resolve();
    });
    observer.observe(el, {childList: true, subtree: true});

    const button = el.querySelector("button");
    const [, span1, span2] = el.getElementsByTagName("span");
    button.click();
    await sleep();

    const [span11, span21] = el.getElementsByTagName("span");
    expect(el.innerHTML).toBe(`<button>change</button><span>0,2</span><span>1,3</span>`);
    expect(span1).toBe(span11);
    expect(span2).toBe(span21);

    await promise;
  });
});

test("For should toggle elements", async () => {
  await withContainer(async (el) => {
    const App = EchoX.component(
      EchoX.reactive().let("list", () => [1, 2, 3]),
      EchoX.Fragment()(
        html.button({
          onclick: (d) => () => {
            if (d.list.length) d.list = [];
            else d.list = [1, 2, 3];
          },
        })("change"),
        html.h1()("Hello"),
        EchoX.For({each: (d) => d.list})(html.span()((d, item) => item.index + "," + item.val)),
        html.h1()("World"),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(
      `<button>change</button><h1>Hello</h1><span>0,1</span><span>1,2</span><span>2,3</span><h1>World</h1>`,
    );

    const button = el.querySelector("button");
    button.click();
    await sleep();
    expect(el.innerHTML).toBe(`<button>change</button><h1>Hello</h1><h1>World</h1>`);

    button.click();
    await sleep();
    expect(el.innerHTML).toBe(
      `<button>change</button><h1>Hello</h1><span>0,1</span><span>1,2</span><span>2,3</span><h1>World</h1>`,
    );
  });
});
