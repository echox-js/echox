import * as EchoX from "echox";
import {test, expect} from "vitest";
import {withContainer} from "./container.js";
import {sleep} from "./sleep.js";

const {html} = EchoX;

test("method should curry expression", async () => {
  await withContainer(async (el) => {
    const Counter = EchoX.component(
      EchoX.reactive().let("count", () => 0),
      html.button({
        onclick: EchoX.method((d, e) => {
          d.count++;
          expect(e).toBeInstanceOf(MouseEvent);
        }),
      })((d) => d.count),
    );

    EchoX.mount(el, Counter());
    expect(el.innerHTML).toBe(`<button>0</button>`);

    el.querySelector("button").click();
    await sleep();
    expect(el.innerHTML).toBe(`<button>1</button>`);
  });
});
