import * as EchoX from "echox";
import {test, expect, vi} from "vitest";
import {withContainer} from "./container.js";

const {html} = EchoX;

test("umount should dispose scope of a component", async () => {
  await withContainer(async (el) => {
    const dispose = vi.fn(() => {});
    const App = EchoX.component(
      EchoX.reactive().call(() => dispose),
      html.h1()("Hello, World!"),
    );
    EchoX.mount(el, App());

    EchoX.unmount(el);
    expect(dispose).toHaveBeenCalled();
  });
});

test("unmount should clear childNodes of root", async () => {
  await withContainer(async (el) => {
    const App = EchoX.component(html.h1()("Hello, World!"));
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<h1>Hello, World!</h1>`);
    EchoX.unmount(el);
    expect(el.innerHTML).toBe(``);
    expect(el.isConnected).toBe(true);
  });
});

test("unmount should dispose scope from child to parent if is nested", async () => {
  await withContainer(async (el) => {
    const list = [];
    const Child = EchoX.component(
      EchoX.reactive().call(() => () => list.push(1)),
      html.h1()("Hello World!"),
    );
    const Parent = EchoX.component(
      EchoX.reactive().call(() => () => list.push(2)),
      html.div()(Child()),
    );
    EchoX.mount(el, Parent());

    EchoX.unmount(el);
    expect(list).toEqual([1, 2]);
  });
});

test("unmount should dispose scope from child to parent if is sibling", async () => {
  await withContainer(async (el) => {
    const list = [];
    const Child = EchoX.component(
      EchoX.reactive().call(() => () => list.push(1)),
      html.h1()("World!"),
    );
    const Parent = EchoX.component(
      EchoX.reactive().call(() => () => list.push(2)),
      EchoX.Fragment()(html.h1()("Hello"), Child()),
    );
    EchoX.mount(el, Parent());

    EchoX.unmount(el);
    expect(list).toEqual([1, 2]);
  });
});
