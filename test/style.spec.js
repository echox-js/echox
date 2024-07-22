import * as EchoX from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";

const {html} = EchoX;

test("cx and css should render style conditionally", async () => {
  await withContainer(async (el) => {
    const App = EchoX.component(
      html.div({
        class: EchoX.cx(null, "a", undefined, new Date(), {b: true}, {c: false, d: true, e: new Date()}),
        style: EchoX.css({backgroundColor: "red"}, {backgroundColor: "blue"}, false && {backgroundColor: "yellow"}),
      })("Hello, World!"),
    );
    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<div class="a b d e" style="background-color: red;">Hello, World!</div>`);
  });
});
