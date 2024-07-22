import * as EchoX from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";
import {sleep} from "./sleep.js";

const {html} = EchoX;

test("ref should bind to a DOM element", async () => {
  await withContainer(async (el) => {
    const App = EchoX.component(
      EchoX.reactive()
        .let("div", null)
        .call((d) => d.div && (d.div.textContent = "hello world")),
      html.div({[EchoX.ref]: "div"}),
    );
    EchoX.mount(el, App());

    await sleep();
    expect(el.innerHTML).toBe(`<div>hello world</div>`);
  });
});

test("ref should bind to component", async () => {
  await withContainer(async (el) => {
    const Add = EchoX.component(
      EchoX.reactive()
        .get(EchoX.ref, null)
        .call((d) => (d[EchoX.ref] = (x, y) => x + y)),
      html.div()("Add"),
    );

    const App = EchoX.component(
      EchoX.reactive()
        .let("add", null)
        .let("sum", 0)
        .call((d) => d.add && (d.sum = d.add(1, 2))),
      EchoX.Fragment()(
        Add({[EchoX.ref]: "add"}),
        html.div()((d) => d.sum),
      ),
    );

    EchoX.mount(el, App());

    await sleep();
    expect(el.innerHTML).toBe(`<div>Add</div><div>3</div>`);
  });
});
