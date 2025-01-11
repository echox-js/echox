import {test, expect, describe, vi} from "vitest";
import {reactive, $, cond, html} from "../src/index.js";
import {track} from "../src/reactive.js";
import {sleep} from "./sleep.js";

describe("reactive", () => {
  test("reactive() should return a reactive scope with defaults.", () => {
    const rx = reactive();
    expect(rx).toBeDefined();
    expect(rx._defs).toEqual({});
    expect(rx.__states__).toEqual({});
  });

  test("reactive.let(key, value) should define a reactive state.", () => {
    const [scope] = reactive().let("count", 0).join();
    expect(scope.count).toBe(0);
  });

  test("reactive.let(key, value) should define multiple reactive states.", () => {
    const [scope] = reactive().let("count", 0).let("name", "John").join();
    expect(scope.count).toBe(0);
    expect(scope.name).toBe("John");
  });

  test("reactive.let(key, value) should return itself.", () => {
    const rx = reactive();
    expect(rx.let("count", 0)).toBe(rx);
  });

  test("reactive.let(key, value) should be able to update state without reactive.join().", () => {
    const [scope] = reactive().let("count", 0).join();
    expect(scope.count).toBe(0);
    scope.count++;
    expect(scope.count).toBe(1);
  });

  test("reactive.join() should return a reactive scope.", () => {
    const [scope] = reactive().let("count", 0).join();
    expect(scope.count).toBe(0);
  });

  test("track(callback) should call callback at next animation frame.", async () => {
    const [scope] = reactive().let("count", 0).join();

    const el = document.createElement("div");
    const update = vi.fn(() => (el.textContent = scope.count));
    track(update);
    expect(el.outerHTML).toBe(`<div>0</div>`);
    expect(update).toHaveBeenCalledTimes(1);

    scope.count++;
    expect(el.outerHTML).toBe(`<div>0</div>`);
    expect(update).toHaveBeenCalledTimes(1);
    await sleep(0);

    expect(el.outerHTML).toBe(`<div>1</div>`);
    expect(update).toHaveBeenCalledTimes(2);

    scope.count++;
    await sleep(0);
    expect(el.outerHTML).toBe(`<div>2</div>`);
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("track(callback) should not call callback when state is not updated.", async () => {
    const [scope] = reactive().let("count", 0).join();

    const el = document.createElement("div");
    const update = vi.fn(() => (el.textContent = scope.count));
    track(update);
    expect(el.outerHTML).toBe(`<div>0</div>`);
    expect(update).toHaveBeenCalledTimes(1);

    scope.count = 0;
    await sleep(0);

    expect(el.outerHTML).toBe(`<div>0</div>`);
    expect(update).toHaveBeenCalledTimes(1);
  });

  test("track(callback) should merge multiple updates into one.", async () => {
    const [scope] = reactive().let("count", 0).join();

    const el = document.createElement("div");
    const update = vi.fn(() => (el.textContent = scope.count));
    track(update);
    expect(el.outerHTML).toBe(`<div>0</div>`);
    expect(update).toHaveBeenCalledTimes(1);

    scope.count++;
    scope.count++;
    scope.count++;
    await sleep(0);

    expect(el.outerHTML).toBe(`<div>3</div>`);
    expect(update).toHaveBeenCalledTimes(2);
  });

  test("track(callback) should track multiple states.", async () => {
    const [scope] = reactive().let("count", 0).let("name", "John").join();

    const el = document.createElement("div");
    const update = vi.fn(() => (el.textContent = `${scope.name} ${scope.count}`));
    track(update);
    expect(el.outerHTML).toBe(`<div>John 0</div>`);
    expect(update).toHaveBeenCalledTimes(1);

    scope.count++;
    await sleep(0);
    expect(el.outerHTML).toBe(`<div>John 1</div>`);
    expect(update).toHaveBeenCalledTimes(2);

    scope.name = "Jane";
    await sleep(0);
    expect(el.outerHTML).toBe(`<div>Jane 1</div>`);
    expect(update).toHaveBeenCalledTimes(3);

    scope.count++;
    scope.name = "Jack";
    await sleep(0);
    expect(el.outerHTML).toBe(`<div>Jack 2</div>`);
    expect(update).toHaveBeenCalledTimes(4);
  });

  test("track(callback) should track multiple callbacks.", async () => {
    const [scope] = reactive().let("count", 0).join();

    const el1 = document.createElement("div");
    const el2 = document.createElement("div");
    const update1 = vi.fn(() => (el1.textContent = scope.count));
    const update2 = vi.fn(() => (el2.textContent = scope.count));
    track(update1);
    track(update2);
    expect(el1.outerHTML).toBe(`<div>0</div>`);
    expect(el2.outerHTML).toBe(`<div>0</div>`);
    expect(update1).toHaveBeenCalledTimes(1);
    expect(update2).toHaveBeenCalledTimes(1);

    scope.count++;
    await sleep(0);
    expect(el1.outerHTML).toBe(`<div>1</div>`);
    expect(el2.outerHTML).toBe(`<div>1</div>`);
    expect(update1).toHaveBeenCalledTimes(2);
    expect(update2).toHaveBeenCalledTimes(2);
  });

  test("track(callback) should track new deps caused by conditionally branches.", async () => {
    const [scope] = reactive().let("count", 0).let("name", "jack").join();

    const span = document.createElement("span");
    const update = vi.fn(() => {
      if (scope.count > 0) span.textContent = scope.name;
    });
    track(update);
    expect(span.outerHTML).toBe(`<span></span>`);
    expect(update).toHaveBeenCalledTimes(1);

    scope.name = "jane";
    await sleep(0);
    expect(span.outerHTML).toBe(`<span></span>`);
    expect(update).toHaveBeenCalledTimes(1); // Will not be called because name is not tracked.

    scope.count++;
    await sleep(0);
    expect(span.outerHTML).toBe(`<span>jane</span>`);
    expect(update).toHaveBeenCalledTimes(2);

    scope.name = "jim";
    await sleep(0);
    expect(span.outerHTML).toBe(`<span>jim</span>`);
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("track(callback) should prevent circular dependencies", async () => {
    const [scope] = reactive().let("count", 0).let("checked", false).join();

    const toggle = vi.fn(() => (scope.checked = !scope.checked));
    const toggleTracked = () => track(toggle);

    const increment = vi.fn(() => scope.checked && scope.count++);
    track(increment);

    const reset = vi.fn(() => (scope.count = 0));
    const resetTracked = () => track(reset);

    expect(scope.count).toBe(0);

    toggleTracked();
    await sleep(0);
    expect(scope.count).toBe(1);

    resetTracked(); // Will not trigger increment because of circular dependencies.
    await sleep(0);
    expect(scope.count).toBe(0);
    expect(increment).toHaveBeenCalledTimes(2);
  });

  test("reactive() should remove deps without mounted DOMs when updating state.", async () => {
    const rx = reactive().let("count", 0);
    const [scope] = rx.join();

    const el = document.createElement("div");
    document.body.appendChild(el);

    const update = vi.fn(() => {
      el.textContent = scope.count;
      return el;
    });
    track(update);
    expect(rx.__states__.count.deps.size).toBe(1);

    scope.count = 1;
    await sleep(0);
    expect(rx.__states__.count.deps.size).toBe(1);

    el.remove();
    scope.count = 2;
    await sleep(0);
    expect(rx.__states__.count.deps.size).toBe(0);
  });

  test("reactive() should not remove deps with non-DOMs when updating state.", async () => {
    const rx = reactive().let("count", 0);
    const [scope] = rx.join();

    const update = vi.fn(() => scope.count);
    track(update);
    expect(rx.__states__.count.deps.size).toBe(1);

    scope.count = 1;
    await sleep(0);
    expect(rx.__states__.count.deps.size).toBe(1);
  });

  test("reactive() should remove effect with disconnected DOM after 1s when getting the state.", async () => {
    const rx = reactive().let("count", 0);
    const [scope] = rx.join();

    const el = document.createElement("div");
    document.body.appendChild(el);

    const update = vi.fn(() => {
      el.textContent = scope.count;
      return el;
    });
    track(update);
    expect(rx.__states__.count.deps.size).toBe(1);

    el.remove();
    expect(rx.__states__.count.deps.size).toBe(1);

    scope.count;
    expect(rx.__states__.count.deps.size).toBe(1);
    await sleep(1000);
    expect(rx.__states__.count.deps.size).toBe(0);
  });

  test("reactive() should track nested object properties.", async () => {
    const [scope] = reactive()
      .let("user", {name: "John", info: {age: 25}})
      .join();

    const el = document.createElement("div");
    const update = vi.fn(() => {
      el.textContent = `${scope.user.name} is ${scope.user.info.age}`;
    });
    track(update);

    expect(el.textContent).toBe("John is 25");
    expect(update).toHaveBeenCalledTimes(1);

    scope.user.name = "Jane";
    await sleep(0);
    expect(el.textContent).toBe("Jane is 25");
    expect(update).toHaveBeenCalledTimes(2);

    scope.user.info.age = 30;
    await sleep(0);
    expect(el.textContent).toBe("Jane is 30");
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("reactive() should track array push and pop operations.", async () => {
    const [scope] = reactive().let("list", [1, 2, 3]).join();

    const el = document.createElement("div");
    const update = vi.fn(() => {
      el.textContent = scope.list.join(",");
    });
    track(update);

    expect(el.textContent).toBe("1,2,3");
    expect(update).toHaveBeenCalledTimes(1);

    scope.list.push(4);
    await sleep(0);
    expect(el.textContent).toBe("1,2,3,4");
    expect(update).toHaveBeenCalledTimes(2);

    scope.list[3] = 5;
    await sleep(0);
    expect(el.textContent).toBe("1,2,3,5");
    expect(update).toHaveBeenCalledTimes(3);

    scope.list.pop();
    await sleep(0);
    expect(el.textContent).toBe("1,2,3");
    expect(update).toHaveBeenCalledTimes(4);
  });

  test("reactive() should track array length changes.", async () => {
    const [scope] = reactive().let("list", [1, 2, 3]).join();

    const el = document.createElement("div");
    const update = vi.fn(() => {
      el.textContent = String(scope.list.length);
    });
    track(update);

    expect(el.textContent).toBe("3");
    expect(update).toHaveBeenCalledTimes(1);

    scope.list.push(4);
    await sleep(0);
    expect(el.textContent).toBe("4");
    expect(update).toHaveBeenCalledTimes(2);

    scope.list.length = 2;
    await sleep(0);
    expect(el.textContent).toBe("2");
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("reactive() should track array index assignments.", async () => {
    const [scope] = reactive().let("list", [1, 2, 3]).join();

    const el = document.createElement("div");
    const update = vi.fn(() => {
      el.textContent = scope.list[1];
    });
    track(update);

    expect(el.textContent).toBe("2");
    expect(update).toHaveBeenCalledTimes(1);

    scope.list[1] = 5;
    await sleep(0);
    expect(el.textContent).toBe("5");
    expect(update).toHaveBeenCalledTimes(2);
  });

  test("reactive() should track array splice and reverse operations.", async () => {
    const [scope] = reactive().let("list", [1, 2, 3]).join();

    const el = document.createElement("div");
    const update = vi.fn(() => {
      el.textContent = scope.list.join(",");
    });
    track(update);

    expect(el.textContent).toBe("1,2,3");
    expect(update).toHaveBeenCalledTimes(1);

    scope.list.splice(1, 1, 4, 5);
    await sleep(0);
    expect(el.textContent).toBe("1,4,5,3");
    expect(update).toHaveBeenCalledTimes(2);

    scope.list.reverse();
    await sleep(0);
    expect(el.textContent).toBe("3,5,4,1");
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("reactive() should track nested array updates.", async () => {
    const [scope] = reactive()
      .let("data", {
        items: [
          [1, 2],
          [3, 4],
        ],
      })
      .join();

    const el = document.createElement("div");
    const update = vi.fn(() => {
      el.textContent = scope.data.items.map((arr) => arr.join("-")).join(",");
    });
    track(update);

    expect(el.textContent).toBe("1-2,3-4");
    expect(update).toHaveBeenCalledTimes(1);

    scope.data.items[0].push(5);
    await sleep(0);
    expect(el.textContent).toBe("1-2-5,3-4");
    expect(update).toHaveBeenCalledTimes(2);

    scope.data.items[1] = [6, 7];
    await sleep(0);
    expect(el.textContent).toBe("1-2-5,6-7");
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("reactive() should track array unshift and shift operations.", async () => {
    const [scope] = reactive().let("list", [1, 2, 3]).join();

    const el = document.createElement("div");
    const update = vi.fn(() => {
      el.textContent = scope.list.join(",");
    });
    track(update);

    expect(el.textContent).toBe("1,2,3");
    expect(update).toHaveBeenCalledTimes(1);

    scope.list.unshift(0);
    await sleep(0);
    expect(el.textContent).toBe("0,1,2,3");
    expect(update).toHaveBeenCalledTimes(2);

    scope.list.shift();
    await sleep(0);
    expect(el.textContent).toBe("1,2,3");
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("reactive() should track array sort operations.", async () => {
    const [scope] = reactive().let("list", [3, 1, 4, 1, 5]).join();

    const el = document.createElement("div");
    const update = vi.fn(() => {
      el.textContent = scope.list.join(",");
    });
    track(update);

    expect(el.textContent).toBe("3,1,4,1,5");
    expect(update).toHaveBeenCalledTimes(1);

    scope.list.sort();
    await sleep(0);
    expect(el.textContent).toBe("1,1,3,4,5");
    expect(update).toHaveBeenCalledTimes(2);

    scope.list.sort((a, b) => b - a);
    await sleep(0);
    expect(el.textContent).toBe("5,4,3,1,1");
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("reactive() should track array fill operations.", async () => {
    const [scope] = reactive().let("list", [1, 2, 3, 4, 5]).join();

    const el = document.createElement("div");
    const update = vi.fn(() => {
      el.textContent = scope.list.join(",");
    });
    track(update);

    expect(el.textContent).toBe("1,2,3,4,5");
    expect(update).toHaveBeenCalledTimes(1);

    scope.list.fill(0, 2, 4);
    await sleep(0);
    expect(el.textContent).toBe("1,2,0,0,5");
    expect(update).toHaveBeenCalledTimes(2);

    scope.list.fill(9);
    await sleep(0);
    expect(el.textContent).toBe("9,9,9,9,9");
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("reactive() should track array copyWithin operations.", async () => {
    const [scope] = reactive().let("list", [1, 2, 3, 4, 5]).join();

    const el = document.createElement("div");
    const update = vi.fn(() => {
      el.textContent = scope.list.join(",");
    });
    track(update);

    expect(el.textContent).toBe("1,2,3,4,5");
    expect(update).toHaveBeenCalledTimes(1);

    scope.list.copyWithin(0, 3);
    await sleep(0);
    expect(el.textContent).toBe("4,5,3,4,5");
    expect(update).toHaveBeenCalledTimes(2);

    scope.list.copyWithin(2, 0, 2);
    await sleep(0);
    expect(el.textContent).toBe("4,5,4,5,5");
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("reactive() should track multiple array operations in sequence.", async () => {
    const [scope] = reactive().let("list", [1, 2, 3]).join();

    const el = document.createElement("div");
    const update = vi.fn(() => {
      el.textContent = scope.list.join(",");
    });
    track(update);

    expect(el.textContent).toBe("1,2,3");
    expect(update).toHaveBeenCalledTimes(1);

    scope.list.push(4);
    scope.list.unshift(0);
    await sleep(0);
    expect(el.textContent).toBe("0,1,2,3,4");
    expect(update).toHaveBeenCalledTimes(2);

    scope.list.sort((a, b) => b - a);
    scope.list.fill(9, 1, 4);
    await sleep(0);
    expect(el.textContent).toBe("4,9,9,9,0");
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("cond() should render content based on condition.", async () => {
    const [scope] = reactive().let("show", true).join();
    const div = html.div([
      cond(
        () => scope.show,
        () => html.span(["Visible"]),
        () => html.span(["Hidden"]),
      ),
    ]);
    document.body.append(div);

    expect(div.outerHTML).toBe(`<div><span>Visible</span></div>`);

    scope.show = false;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Hidden</span></div>`);

    document.body.removeChild(div);
  });

  test("cond() should handle falsy fallback.", async () => {
    const [scope] = reactive().let("show", true).join();
    const div = html.div([
      cond(
        () => scope.show,
        () => html.span(["Visible"]),
      ),
    ]);
    document.body.append(div);

    expect(div.outerHTML).toBe(`<div><span>Visible</span></div>`);

    scope.show = false;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div></div>`);

    document.body.removeChild(div);
  });

  test("cond() should track dependencies in condition.", async () => {
    const [scope] = reactive().let("count", 0).let("threshold", 3).join();

    const div = html.div([
      cond(
        () => scope.count > scope.threshold,
        () => html.span(["Above"]),
        () => html.span(["Below"]),
      ),
    ]);
    document.body.append(div);

    expect(div.outerHTML).toBe(`<div><span>Below</span></div>`);

    scope.count = 4;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Above</span></div>`);

    scope.threshold = 5;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Below</span></div>`);

    document.body.removeChild(div);
  });

  test("cond() should track dependencies in render functions.", async () => {
    const [scope] = reactive().let("show", true).let("text", "Hello").join();

    const div = html.div([
      cond(
        () => scope.show,
        () => html.span([$(() => scope.text)]),
        () => html.span(["Hidden"]),
      ),
    ]);
    document.body.append(div);

    expect(div.outerHTML).toBe(`<div><span>Hello</span></div>`);

    scope.text = "World";
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>World</span></div>`);

    scope.show = false;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Hidden</span></div>`);

    scope.text = "Changed";
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Hidden</span></div>`);

    document.body.removeChild(div);
  });

  test("cond() should handle nested conditions.", async () => {
    const [scope] = reactive().let("outer", true).let("inner", true).join();

    const div = html.div([
      cond(
        () => scope.outer,
        () =>
          cond(
            () => scope.inner,
            () => html.span(["Both"]),
            () => html.span(["Outer only"]),
          ),
        () => html.span(["None"]),
      ),
    ]);
    document.body.append(div);

    expect(div.outerHTML).toBe(`<div><span>Both</span></div>`);

    scope.inner = false;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Outer only</span></div>`);

    scope.outer = false;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>None</span></div>`);

    scope.inner = true;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>None</span></div>`);

    scope.outer = true;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Both</span></div>`);

    document.body.removeChild(div);
  });

  test("cond() should optimize renders for unchanged conditions.", async () => {
    const [scope] = reactive().let("show", true).let("unrelated", 0).join();

    const renderTrue = vi.fn(() => html.span(["Visible"]));
    const renderFalse = vi.fn(() => html.span(["Hidden"]));

    const div = html.div([cond(() => scope.show, renderTrue, renderFalse)]);
    document.body.append(div);

    expect(div.outerHTML).toBe(`<div><span>Visible</span></div>`);
    expect(renderTrue).toHaveBeenCalledTimes(1);
    expect(renderFalse).toHaveBeenCalledTimes(0);

    scope.unrelated++;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Visible</span></div>`);
    expect(renderTrue).toHaveBeenCalledTimes(1);
    expect(renderFalse).toHaveBeenCalledTimes(0);

    scope.show = false;
    await sleep(0);
    expect(div.outerHTML).toBe(`<div><span>Hidden</span></div>`);
    expect(renderTrue).toHaveBeenCalledTimes(1);
    expect(renderFalse).toHaveBeenCalledTimes(1);

    document.body.removeChild(div);
  });
});
