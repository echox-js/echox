import * as ex from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";
import {sleep} from "./sleep.js";

const {$} = ex;

test("For should render list children", async () => {
  await withContainer((el) => {
    const App = ex.component(ex.For({each: [1, 2, 3]})($.h1()("Hello, World!")));
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1><h1>Hello, World!</h1><h1>Hello, World!</h1>`);
  });
});

test("For should render list state children", async () => {
  await withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("list", () => [1, 2, 3]),
      ex.For({each: (d) => d.list})($.h1()("Hello, World!")),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1><h1>Hello, World!</h1><h1>Hello, World!</h1>`);
  });
});

test("For should render list children with value and index", async () => {
  await withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("test", () => "A"),
      ex.For({each: [1, 2, 3]})($.h1()((d, item) => d.test + item.val + item.index)),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>A10</h1><h1>A21</h1><h1>A32</h1>`);
  });
});

test("For should render list state children with value and index", async () => {
  await withContainer((el) => {
    const App = ex.component(
      ex
        .reactive()
        .state("test", () => "A")
        .state("list", () => [1, 2, 3]),
      ex.For({each: (d) => d.list})($.h1()((d, item) => d.test + item.val + item.index)),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>A10</h1><h1>A21</h1><h1>A32</h1>`);
  });
});

test("For should render nested list children with value and index", async () => {
  await withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("test", () => "A"),
      ex.For({each: [1, 2, 3]})(
        ex.For({each: [1, 2]})(
          $.h1()((d, x1, x2) => {
            return d.test + x1.val + x1.index + x2.val + x2.index;
          }),
        ),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>A1010</h1><h1>A1021</h1><h1>A2110</h1><h1>A2121</h1><h1>A3210</h1><h1>A3221</h1>`);
  });
});

test("For should render nested list state children with value and index", async () => {
  await withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("list", () => [
        {text: "A", list: [1, 2]},
        {text: "B", list: [3, 4]},
      ]),
      ex.For({each: (d) => d.list})(
        ex.For({each: ($, x1) => x1.val.list})(
          $.h1()((d, x1, x2) => {
            return x1.val.text + x1.index + x2.val + x2.index;
          }),
        ),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>A010</h1><h1>A021</h1><h1>B130</h1><h1>B141</h1>`);
  });
});

test("For and Match should work together", async () => {
  await withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("list", () => [1, 2, 3]),
      ex.For({each: (d) => d.list})(
        ex.Match({value: (d, list) => list.val})(
          ex.Arm({test: 1})($.h1()("One")),
          ex.Arm({test: 2})($.h1()("Two")),
          ex.Arm({test: 3})($.h1()("Three")),
        ),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>One</h1><h1>Two</h1><h1>Three</h1>`);
  });
});

test("For should render reactive list children", async () => {
  await withContainer(async (el) => {
    const App = ex.component(
      ex.reactive().state("list", () => [1, 2, 3]),
      ex.Fragment()(
        $.button({
          onclick: (d) => () => {
            d.list.pop();
            d.list.reverse();
            d.list.push(4);
            d.list = [...d.list];
          },
        })("change"),
        ex.For({each: (d) => d.list})($.span()((d, item) => item.index + "," + item.val)),
      ),
    );
    ex.mount(el, App());
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
