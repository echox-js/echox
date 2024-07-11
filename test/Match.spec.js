import * as ex from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";
import {sleep} from "./sleep.js";

const {$} = ex;

test("Match should do nothing if no children", () => {
  withContainer((el) => {
    const App = ex.component(ex.Match());
    ex.mount(el, App());
    expect(el.innerHTML).toBe(``);
  });
});

test("Match with truthy test prop should render the first child", () => {
  withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("number", () => 5),
      ex.Match({test: (d) => d.number > 0})($.h1()("Hello, World!")),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1>`);
  });
});

test("Match with falsy test prop should render the second child", () => {
  withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("number", () => 5),
      ex.Match({test: (d) => d.number > 10})($.h1()("Hello"), $.h1()("World")),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>World</h1>`);
  });
});

test("Match with falsy test prop should ignore the second child if is undefined", () => {
  withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("number", () => 5),
      ex.Match({test: (d) => d.number > 10})($.h1()("Hello, World!")),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(``);
  });
});

test("Match with test prop should only rerender when the test result changes", async () => {
  await withContainer(async (el) => {
    const App = ex.component(
      ex.reactive().state("count", () => 0),
      ex.Fragment()(
        $.h1()("Hello"),
        ex.Match({test: (d) => d.count % 2 === 0})($.h1()("Even"), $.h1()("Odd")),
        $.h1()("World"),
        $.button({onclick: (d) => () => d.count++})((d) => d.count),
      ),
    );
    ex.mount(el, App());

    expect(el.innerHTML).toBe(`<h1>Hello</h1><h1>Even</h1><h1>World</h1><button>0</button>`);

    const button = el.querySelector("button");
    button.click();
    await sleep();
    expect(el.innerHTML).toBe(`<h1>Hello</h1><h1>Odd</h1><h1>World</h1><button>1</button>`);

    const odd = el.querySelector("h1:nth-child(2)");
    button.click();
    button.click();
    await sleep();
    const odd2 = el.querySelector("h1:nth-child(2)");
    expect(el.innerHTML).toBe(`<h1>Hello</h1><h1>Odd</h1><h1>World</h1><button>3</button>`);
    expect(odd).toBe(odd2);

    button.click();
    await sleep();
    expect(el.innerHTML).toBe(`<h1>Hello</h1><h1>Even</h1><h1>World</h1><button>4</button>`);
  });
});

test("Match should remove and insert element when the test result changes", async () => {
  await withContainer(async (el) => {
    const App = ex.component(
      ex.reactive().state("count", () => 0),
      ex.Fragment()(
        $.h1()("Hello"),
        ex.Match({test: (d) => d.count % 2 === 0})($.h1()("A")),
        $.h1()("World"),
        $.button({onclick: (d) => () => d.count++})((d) => d.count),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello</h1><h1>A</h1><h1>World</h1><button>0</button>`);

    const button = el.querySelector("button");
    button.click();
    await sleep();
    expect(el.innerHTML).toBe(`<h1>Hello</h1><h1>World</h1><button>1</button>`);

    button.click();
    await sleep();
    expect(el.innerHTML).toBe(`<h1>Hello</h1><h1>A</h1><h1>World</h1><button>2</button>`);
  });
});

test("Match with value prop should match the fist Arm with the same value", () => {
  withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("number", () => 2),
      ex.Match({value: (d) => d.number})(
        ex.Arm({test: 1})($.h1()("Hello")), //
        $.div()($.h1()("World")),
        ex.Arm({test: 2})($.h1()("World")),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>World</h1>`);
  });
});

test("Match should do nothing is no match Arm is found", () => {
  withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("number", () => 3),
      ex.Match({value: (d) => d.number})(
        ex.Arm({test: 1})($.h1()("Hello")),
        ex.Arm({test: 2})($.h1()("World")),
        $.div()($.h1()("World")),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(``);
  });
});

test("Match with value prop should ignore the Arm with functional test", () => {
  withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("number", () => 2),
      ex.Match({value: (d) => d.number})(
        ex.Arm({test: 1})($.h1()("Hello")),
        ex.Arm({test: (d) => d.number === 2})($.h1()("World")),
        ex.Arm({test: 2})($.h1()("!")),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>!</h1>`);
  });
});

test("Match should use empty Arm is no match is found", () => {
  withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("number", () => 3),
      ex.Match({value: (d) => d.number})(
        ex.Arm({test: 1})($.h1()("Hello")),
        ex.Arm({test: 2})($.h1()("World")),
        ex.Arm()($.h1()("!")),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>!</h1>`);
  });
});

test("Match should be nested", () => {
  withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("number", () => 2),
      ex.Match({value: (d) => d.number})(
        ex.Arm({test: 1})($.h1()("Hello")),
        ex.Arm({test: 2})(
          $.h1()("World"),
          ex.Match({value: (d) => d.number})(ex.Arm({test: 1})($.h1()("Hello")), ex.Arm({test: 2})($.h1()("World"))),
        ),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>World</h1><h1>World</h1>`);
  });
});

test("Match should return the first Arm with functional test", () => {
  withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("number", () => 2),
      ex.Match()(
        ex.Arm({test: (d) => d.number === 1})($.h1()((d) => d.number)),
        ex.Arm({test: (d) => d.number === 2})($.h1()((d) => d.number)),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>2</h1>`);
  });
});
