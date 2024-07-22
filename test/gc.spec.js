import * as EchoX from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";
import {sleep} from "./sleep.js";

const {html} = EchoX;

function sizeof(scope, key) {
  return scope.__states__[key].deps.size;
}

test("Match should cleanup effects every cycle.", async () => {
  await withContainer(async (el) => {
    let scope;
    const App = EchoX.component(
      EchoX.reactive()
        .let("text", "hello")
        .let("pre", true)
        .call((d) => (scope = d)),
      EchoX.Fragment()(
        html.button({
          onclick: EchoX.method((d) => (d.pre = !d.pre)),
        })("change"),
        EchoX.Match({test: (d) => d.pre})(
          html.pre()((d) => d.text),
          html.span()((d) => d.text),
        ),
      ),
    );
    EchoX.mount(el, App());
    await sleep();

    expect(sizeof(scope, "text")).toBe(1);

    el.querySelector("button").click();
    await sleep(1000);
    expect(sizeof(scope, "text")).toBe(1);
  });
});

test("For should cleanup effects every cycle.", async () => {
  await withContainer(async (el) => {
    let scope;
    const App = EchoX.component(
      EchoX.reactive()
        .let("list", [1, 2, 3])
        .call((d) => (scope = d)),
      EchoX.Fragment()(
        html.button({
          onclick: EchoX.method((d) => (d.list = [])),
        })("change"),
        EchoX.For({of: (d) => d.list})(html.p()((d, item) => item.val)),
      ),
    );
    EchoX.mount(el, App());
    await sleep();

    expect(sizeof(scope, "list")).toBe(1);

    el.querySelector("button").click();
    await sleep(1000);
    expect(sizeof(scope, "list")).toBe(1);
  });
});
