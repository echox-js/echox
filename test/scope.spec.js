import * as EchoX from "echox";
import {test, expect, vi} from "vitest";
import {withContainer} from "./container.js";
import {sleep} from "./sleep.js";

const {html} = EchoX;

test("scope should be composable", async () => {
  await withContainer(async (el) => {
    const dispose = vi.fn(() => {});
    const mouse = EchoX.reactive()
      .get("x0", 0)
      .get("y0", 0)
      .let("x", (d) => d.x0 ?? 0)
      .let("y", (d) => d.y0 ?? 0)
      .call((d) => {
        const mousemove = (e) => ((d.x = e.clientX), (d.y = e.clientY));
        document.addEventListener("mousemove", mousemove);
        return () => {
          document.removeEventListener("mousemove", mousemove);
          dispose();
        };
      });

    const App = EchoX.component(
      EchoX.reactive()
        .let("x0", 100)
        .let("y0", 100)
        .let("mouse", (d) => mouse.join({x0: d.x0, y0: d.y0})),
      html.div()((d) => `${d.mouse.x}, ${d.mouse.y}`),
    );

    EchoX.mount(el, App());
    expect(el.innerHTML).toBe(`<div>100, 100</div>`);

    document.dispatchEvent(new MouseEvent("mousemove", {clientX: 200, clientY: 200}));
    await sleep();
    expect(el.innerHTML).toBe(`<div>200, 200</div>`);

    EchoX.unmount(el);
    expect(dispose).toHaveBeenCalled();
  });
});
