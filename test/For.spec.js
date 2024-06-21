import Echo, {X} from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";

test("For should render list children", () => {
  withContainer((el) => {
    const App = Echo.component(Echo.For({each: [1, 2, 3]})(X.h1()("Hello, World!")));
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1><h1>Hello, World!</h1><h1>Hello, World!</h1>`);
  });
});

test("For should render list state children", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("list", () => [1, 2, 3]),
      Echo.For({each: (d) => d.list})(X.h1()("Hello, World!")),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1><h1>Hello, World!</h1><h1>Hello, World!</h1>`);
  });
});

test("For should render list children with value and index", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("test", () => "A"),
      Echo.For({each: [1, 2, 3]})(X.h1()((d, item) => d.test + item.val + item.index)),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>A10</h1><h1>A21</h1><h1>A32</h1>`);
  });
});

test("For should render list state children with value and index", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive()
        .state("test", () => "A")
        .state("list", () => [1, 2, 3]),
      Echo.For({each: (d) => d.list})(X.h1()((d, item) => d.test + item.val + item.index)),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>A10</h1><h1>A21</h1><h1>A32</h1>`);
  });
});

test("For should render nested list children with value and index", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("test", () => "A"),
      Echo.For({each: [1, 2, 3]})(
        Echo.For({each: [1, 2]})(
          X.h1()((d, x1, x2) => {
            return d.test + x1.val + x1.index + x2.val + x2.index;
          }),
        ),
      ),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>A1010</h1><h1>A1021</h1><h1>A2110</h1><h1>A2121</h1><h1>A3210</h1><h1>A3221</h1>`);
  });
});

test("For should render nested list state children with value and index", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("list", () => [
        {text: "A", list: [1, 2]},
        {text: "B", list: [3, 4]},
      ]),
      Echo.For({each: (d) => d.list})(
        Echo.For({each: (_, x1) => x1.val.list})(
          X.h1()((d, x1, x2) => {
            return x1.val.text + x1.index + x2.val + x2.index;
          }),
        ),
      ),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>A010</h1><h1>A021</h1><h1>B130</h1><h1>B141</h1>`);
  });
});

test("For and Match should work together", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("list", () => [1, 2, 3]),
      Echo.For({each: (d) => d.list})(
        Echo.Match({value: (d, list) => list.val})(
          Echo.Arm({test: 1})(X.h1()("One")),
          Echo.Arm({test: 2})(X.h1()("Two")),
          Echo.Arm({test: 3})(X.h1()("Three")),
        ),
      ),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>One</h1><h1>Two</h1><h1>Three</h1>`);
  });
});
