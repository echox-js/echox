import * as EchoX from "echox";
import {test, expect, vi} from "vitest";
import {withContainer} from "./container.js";
import {sleep} from "./sleep.js";

const {html} = EchoX;

test("component should call effect before rendering dom", async () => {
  await withContainer(async (el) => {
    const effect = vi.fn(() => {});
    const App = EchoX.component(EchoX.reactive().call(effect), html.h1()("Hello, World!"));
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1>`);
    expect(effect).toHaveBeenCalled();
  });
});

test("component should call effect one by one", async () => {
  await withContainer(async (el) => {
    const App = EchoX.component(
      EchoX.reactive()
        .let("list", () => [])
        .call((d) => d.list.push(1))
        .call((d) => d.list.push(2))
        .call((d) => d.list.push(3)),
      html.h1()((d) => d.list.join(" ")),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>1 2 3</h1>`);
  });
});

test("component should call effect from parent to child", async () => {
  await withContainer(async (el) => {
    const list = [];
    const Child = EchoX.component(
      EchoX.reactive().call(() => list.push(1)),
      html.h1()("Hello, World!"),
    );
    const Parent = EchoX.component(
      EchoX.reactive().call(() => list.push(2)),
      Child(),
    );
    EchoX.mount(el, Parent());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1>`);
    expect(list).toEqual([2, 1]);
  });
});

test("effect should update dom when state changes", async () => {
  await withContainer(async (el) => {
    const count = vi.fn((d) => d.count);
    const App = EchoX.component(
      EchoX.reactive()
        .let("count", () => 0)
        .call(async (d) => {
          await sleep(10);
          d.count++;
        }),
      html.h1()(count),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>0</h1>`);
    expect(count).toHaveBeenCalledTimes(1);

    await sleep(30);
    expect(el.innerHTML).toBe(`<h1>1</h1>`);
    expect(count).toHaveBeenCalledTimes(2);
  });
});

test("effect should return dispose function", async () => {
  await withContainer(async (el) => {
    const dispose = vi.fn(() => {});
    const dispose2 = vi.fn(() => {});
    const App = EchoX.component(
      EchoX.reactive()
        .call(() => dispose)
        .call(() => dispose2),
      html.h1()("Hello, World!"),
    );
    EchoX.mount(el, App());
    expect(dispose).not.toHaveBeenCalled();
    expect(dispose2).not.toHaveBeenCalled();
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1>`);

    await sleep();
    EchoX.unmount(el);
    expect(el.innerHTML).toBe(``);
    expect(dispose).toHaveBeenCalled();
    expect(dispose2).toHaveBeenCalled();
  });
});

test("effect should call dispose function when delete element in For controlFlow", async () => {
  await withContainer(async (el) => {
    const list = [];

    const H1 = EchoX.component(
      EchoX.reactive()
        .get("index")
        .call((d) => () => list.push(d.index)),
      html.h1()((d) => d.index),
    );

    const Item = EchoX.component(
      EchoX.reactive()
        .get("index")
        .call((d) => () => list.push(d.index)),
      H1({index: (d) => d.index + 1}),
    );

    const App = EchoX.component(
      EchoX.reactive().let("list", () => [1, 2, 3]),
      EchoX.Fragment()(
        html.button({onclick: (d) => () => d.list.pop()})("Delete"),
        EchoX.For({of: (d) => d.list})(Item({index: (d, item) => item.index})),
      ),
    );

    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<button>Delete</button><h1>1</h1><h1>2</h1><h1>3</h1>`);

    const button = el.querySelector("button");
    button.click();

    await sleep();
    expect(el.innerHTML).toBe(`<button>Delete</button><h1>1</h1><h1>2</h1>`);
    expect(list).toEqual([3, 2]);
  });
});

test("effect should not call when reverse list", async () => {
  await withContainer(async (el) => {
    const list = [];

    const Item = EchoX.component(
      EchoX.reactive()
        .get("index")
        .call((d) => () => list.push(d.index)),
      html.h1()((d) => d.index),
    );

    const App = EchoX.component(
      EchoX.reactive().let("list", () => [1, 2, 3]),
      EchoX.Fragment()(
        html.button({onclick: (d) => () => d.list.reverse()})("Reverse"),
        EchoX.For({of: (d) => d.list})(Item({index: (d, item) => item.val})),
      ),
    );

    EchoX.mount(el, App());

    const button = el.querySelector("button");
    button.click();

    await sleep();
    expect(list).toEqual([]);
  });
});

test("effect should call dispose function when delete element in Match controlFlow", async () => {
  await withContainer(async (el) => {
    const dispose = vi.fn(() => {});

    const True = EchoX.component(
      EchoX.reactive().call(() => dispose),
      html.h1()("True"),
    );

    const App = EchoX.component(
      EchoX.reactive().let("bool", true),
      EchoX.Fragment()(
        html.button({onclick: (d) => () => (d.bool = !d.bool)})("Change"),
        EchoX.Match({test: (d) => d.bool})(True(), html.h1()("false")),
      ),
    );

    EchoX.mount(el, App());

    expect(el.innerHTML).toBe(`<button>Change</button><h1>True</h1>`);
    expect(dispose).not.toHaveBeenCalled();

    const button = el.querySelector("button");
    button.click();
    await sleep();
    expect(el.innerHTML).toBe(`<button>Change</button><h1>false</h1>`);
    expect(dispose).toHaveBeenCalled();
  });
});
