import {test, expect, describe, vi} from "vitest";
import {reactive} from "../src/index.js";
import {track, Reactive} from "../src/reactive.js";
import {sleep} from "./sleep.js";

describe("reactive", () => {
  test("reactive.prototype should be Reactive.prototype.", () => {
    expect(reactive.prototype).toBe(Reactive.prototype);
  });

  test("reactive() should return a reactive scope with defaults.", () => {
    const rx = reactive();
    expect(rx).toBeDefined();
    expect(rx._defs).toEqual({});
    expect(rx.__states__).toEqual({});
    expect(rx._effects).toEqual([]);
  });

  test("reactive.state(key, value) should define a reactive state.", () => {
    const [scope] = reactive().state("count", 0).join();
    expect(scope.count).toBe(0);
  });

  test("reactive.state(key, value) should define multiple reactive states.", () => {
    const [scope] = reactive().state("count", 0).state("name", "John").join();
    expect(scope.count).toBe(0);
    expect(scope.name).toBe("John");
  });

  test("reactive.state(key, value) should return itself.", () => {
    const rx = reactive();
    expect(rx.state("count", 0)).toBe(rx);
  });

  test("reactive.state(key, value) should be able to update state with reactive.join().", () => {
    const [scope] = reactive().state("count", 0).join();
    expect(scope.count).toBe(0);
    scope.count++;
    expect(scope.count).toBe(1);
  });

  test("reactive.drive(key, fn) should return itself.", () => {
    const rx = reactive();
    expect(rx.computed("double", (s) => s.count * 2)).toBe(rx);
  });

  test("reactive.computed(key, fn) should define a derived state.", async () => {
    const [scope] = reactive()
      .state("count", 0)
      .computed("double", (s) => s.count * 2)
      .join();

    expect(scope.double).toBe(0);
    scope.count++;
    await sleep(0);
    expect(scope.double).toBe(2);
  });

  test("reactive.computed(key, fn) should only update one time when deps update.", async () => {
    const double = vi.fn((s) => s.count * 2);
    const [scope] = reactive().state("count", 0).computed("double", double).join();
    scope.count++;
    scope.count++;
    await sleep(0);
    expect(double).toHaveBeenCalledTimes(2);
    expect(scope.double).toBe(4);
    expect(double).toHaveBeenCalledTimes(2);
  });

  test("reactive.computed(key, fn) should define chained states.", async () => {
    const [scope] = reactive()
      .state("count", 0)
      .computed("double", (s) => s.count * 2)
      .computed("triple", (s) => s.double * 3)
      .join();

    expect(scope.triple).toBe(0);
    scope.count++;
    await sleep(0);
    expect(scope.triple).toBe(6);
  });

  test("reactive.computed(key, fn) don't care about the order of definitions.", async () => {
    const [scope] = reactive()
      .computed("double", (s) => s.count * 2)
      .state("count", 0)
      .join();

    expect(scope.double).toBe(0);
    scope.count++;
    await sleep(0);
    expect(scope.double).toBe(2);
  });

  test("reactive.effect(effect) should return itself.", () => {
    const rx = reactive();
    expect(rx.effect(() => {})).toBe(rx);
  });

  test("reactive.effect(effect) should not call the effect before joining.", () => {
    let count = 0;
    reactive().effect(() => (count = 1));
    expect(count).toBe(0);
  });

  test("reactive.effect(effect) should call the effect immediately after joining.", () => {
    let count = 0;
    reactive()
      .effect(() => (count = 1))
      .join();
    expect(count).toBe(1);
  });

  test("reactive.effect(effect) should call when states update", async () => {
    const effect = vi.fn((s) => s.count);
    const [scope] = reactive().state("count", 0).effect(effect).join();
    scope.count++;
    scope.count++;
    scope.count++;
    await sleep(0);
    expect(effect).toHaveBeenCalledTimes(2);
  });

  test("reactive.effect(effect) should only collect functional disposes.", () => {
    const rx = reactive();
    rx.effect(() => 1)
      .effect(() => "string")
      .effect(() => {})
      .effect(() => null)
      .effect(() => ({}))
      .effect(() => () => {})
      .join();
    expect(rx._disposes.length).toBe(1);
  });

  test("reactive.effect(effect) should dispose resources", async () => {
    const d = vi.fn(() => {});
    const d1 = vi.fn(() => {});
    const [, , dispose] = reactive()
      .effect(() => d)
      .effect(() => d1)
      .join();
    expect(d).toHaveBeenCalledTimes(0);
    expect(d1).toHaveBeenCalledTimes(0);
    dispose();
    expect(d).toHaveBeenCalledTimes(1);
    expect(d1).toHaveBeenCalledTimes(1);
  });

  test("reactive.join() should return a reactive scope.", () => {
    const [scope] = reactive().state("count", 0).join();
    expect(scope.count).toBe(0);
  });

  test("track(callback) should call callback at next animation frame.", async () => {
    const [scope] = reactive().state("count", 0).join();

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
    const [scope] = reactive().state("count", 0).join();

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
    const [scope] = reactive().state("count", 0).join();

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
    const [scope] = reactive().state("count", 0).state("name", "John").join();

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
    const [scope] = reactive().state("count", 0).join();

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
    const [scope] = reactive().state("count", 0).state("name", "jack").join();

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
    const [scope] = reactive().state("count", 0).state("checked", false).join();

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
    const rx = reactive().state("count", 0);
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
    const rx = reactive().state("count", 0);
    const [scope] = rx.join();

    const update = vi.fn(() => scope.count);
    track(update);
    expect(rx.__states__.count.deps.size).toBe(1);

    scope.count = 1;
    await sleep(0);
    expect(rx.__states__.count.deps.size).toBe(1);
  });

  test("reactive() should remove effect with disconnected DOM after 1s when getting the state.", async () => {
    const rx = reactive().state("count", 0);
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
});
