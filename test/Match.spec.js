import Echo, {X} from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";

test("Match should do nothing if no children", () => {
  withContainer((el) => {
    const App = Echo.component(Echo.Match());
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(``);
  });
});

test("Match with truthy test prop should render the first child", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("number", () => 5),
      Echo.Match({test: (d) => d.number > 0})(X.h1()("Hello, World!")),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1>`);
  });
});

test("Match with falsy test prop should render the second child", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("number", () => 5),
      Echo.Match({test: (d) => d.number > 10})(X.h1()("Hello"), X.h1()("World")),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>World</h1>`);
  });
});

test("Match with falsy test prop should ignore the second child if is undefined", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("number", () => 5),
      Echo.Match({test: (d) => d.number > 10})(X.h1()("Hello, World!")),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(``);
  });
});

test("Match with value prop should match the fist Arm with the same value", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("number", () => 2),
      Echo.Match({value: (d) => d.number})(
        Echo.Arm({test: 1})(X.h1()("Hello")), //
        X.div()(X.h1()("World")),
        Echo.Arm({test: 2})(X.h1()("World")),
      ),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>World</h1>`);
  });
});

test("Match should do nothing is no match Arm is found", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("number", () => 3),
      Echo.Match({value: (d) => d.number})(
        Echo.Arm({test: 1})(X.h1()("Hello")),
        Echo.Arm({test: 2})(X.h1()("World")),
        X.div()(X.h1()("World")),
      ),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(``);
  });
});

test("Match with value prop should ignore the Arm with functional test", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("number", () => 2),
      Echo.Match({value: (d) => d.number})(
        Echo.Arm({test: 1})(X.h1()("Hello")),
        Echo.Arm({test: (d) => d.number === 2})(X.h1()("World")),
        Echo.Arm({test: 2})(X.h1()("!")),
      ),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>!</h1>`);
  });
});

test("Match should use empty Arm is no match is found", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("number", () => 3),
      Echo.Match({value: (d) => d.number})(
        Echo.Arm({test: 1})(X.h1()("Hello")),
        Echo.Arm({test: 2})(X.h1()("World")),
        Echo.Arm()(X.h1()("!")),
      ),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>!</h1>`);
  });
});

test("Match should be nested", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("number", () => 2),
      Echo.Match({value: (d) => d.number})(
        Echo.Arm({test: 1})(X.h1()("Hello")),
        Echo.Arm({test: 2})(
          X.h1()("World"),
          Echo.Match({value: (d) => d.number})(
            Echo.Arm({test: 1})(X.h1()("Hello")),
            Echo.Arm({test: 2})(X.h1()("World")),
          ),
        ),
      ),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>World</h1><h1>World</h1>`);
  });
});

test("Match should return the first Arm with functional test", () => {
  withContainer((el) => {
    const App = Echo.component(
      Echo.reactive().state("number", () => 2),
      Echo.Match()(
        Echo.Arm({test: (d) => d.number === 1})(X.h1()((d) => d.number)),
        Echo.Arm({test: (d) => d.number === 2})(X.h1()((d) => d.number)),
      ),
    );
    Echo.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>2</h1>`);
  });
});
