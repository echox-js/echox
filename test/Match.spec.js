import * as EchoX from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";
import {sleep} from "./sleep.js";

const {X} = EchoX;

test("Match should do nothing if no children", () => {
  withContainer((el) => {
    const App = EchoX.component(EchoX.Match());
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(``);
  });
});

test("Match with truthy test prop should render the first child", () => {
  withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().state("number", () => 5),
      EchoX.Match({test: (d) => d.number > 0})(X.h1()("Hello, World!")),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1>`);
  });
});

test("Match with falsy test prop should render the second child", () => {
  withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().state("number", () => 5),
      EchoX.Match({test: (d) => d.number > 10})(X.h1()("Hello"), X.h1()("World")),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>World</h1>`);
  });
});

test("Match with falsy test prop should ignore the second child if is undefined", () => {
  withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().state("number", () => 5),
      EchoX.Match({test: (d) => d.number > 10})(X.h1()("Hello, World!")),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(``);
  });
});

test("Match with test prop should only rerender when the test result changes", async () => {
  await withContainer(async (el) => {
    const App = EchoX.component(
      EchoX.reactive().state("count", () => 0),
      EchoX.Fragment()(
        X.h1()("Hello"),
        EchoX.Match({test: (d) => d.count % 2 === 0})(X.h1()("Even"), X.h1()("Odd")),
        X.h1()("World"),
        X.button({onclick: (d) => () => d.count++})((d) => d.count),
      ),
    );
    EchoX.mount(el, App());

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
    const App = EchoX.component(
      EchoX.reactive().state("count", () => 0),
      EchoX.Fragment()(
        X.h1()("Hello"),
        EchoX.Match({test: (d) => d.count % 2 === 0})(X.h1()("A")),
        X.h1()("World"),
        X.button({onclick: (d) => () => d.count++})((d) => d.count),
      ),
    );
    EchoX.mount(el, App());
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
    const App = EchoX.component(
      EchoX.reactive().state("number", () => 2),
      EchoX.Match({value: (d) => d.number})(
        EchoX.Arm({test: 1})(X.h1()("Hello")), //
        X.div()(X.h1()("World")),
        EchoX.Arm({test: 2})(X.h1()("World")),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>World</h1>`);
  });
});

test("Match should do nothing is no match Arm is found", () => {
  withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().state("number", () => 3),
      EchoX.Match({value: (d) => d.number})(
        EchoX.Arm({test: 1})(X.h1()("Hello")),
        EchoX.Arm({test: 2})(X.h1()("World")),
        X.div()(X.h1()("World")),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(``);
  });
});

test("Match with value prop should ignore the Arm with functional test", () => {
  withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().state("number", () => 2),
      EchoX.Match({value: (d) => d.number})(
        EchoX.Arm({test: 1})(X.h1()("Hello")),
        EchoX.Arm({test: (d) => d.number === 2})(X.h1()("World")),
        EchoX.Arm({test: 2})(X.h1()("!")),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>!</h1>`);
  });
});

test("Match should use empty Arm is no match is found", () => {
  withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().state("number", () => 3),
      EchoX.Match({value: (d) => d.number})(
        EchoX.Arm({test: 1})(X.h1()("Hello")),
        EchoX.Arm({test: 2})(X.h1()("World")),
        EchoX.Arm()(X.h1()("!")),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>!</h1>`);
  });
});

test("Match should be nested", () => {
  withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().state("number", () => 2),
      EchoX.Match({value: (d) => d.number})(
        EchoX.Arm({test: 1})(X.h1()("Hello")),
        EchoX.Arm({test: 2})(
          X.h1()("World"),
          EchoX.Match({value: (d) => d.number})(
            EchoX.Arm({test: 1})(X.h1()("Hello")),
            EchoX.Arm({test: 2})(X.h1()("World")),
          ),
        ),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>World</h1><h1>World</h1>`);
  });
});

test("Match should return the first Arm with functional test", () => {
  withContainer((el) => {
    const App = EchoX.component(
      EchoX.reactive().state("number", () => 2),
      EchoX.Match()(
        EchoX.Arm({test: (d) => d.number === 1})(X.h1()((d) => d.number)),
        EchoX.Arm({test: (d) => d.number === 2})(X.h1()((d) => d.number)),
      ),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>2</h1>`);
  });
});
