import {test, expect, describe, vi} from "vitest";
import {reactive, track} from "../src/index.js";
import {sleep} from "./sleep.js";

describe("reactive", () => {
  test("reactive() should return a reactive state with defaults.", () => {
    const rx = reactive();
    expect(rx).toBeDefined();
    expect(rx._defs).toEqual({});
    expect(rx.__states__).toEqual({});
    expect(rx._effects).toEqual([]);
  });

  test("reactive.state(key, value) should define a reactive state.", () => {
    const [state] = reactive().state("count", 0).join();
    expect(state.count).toBe(0);
  });

  test("reactive.state(key, value) should define multiple reactive states.", () => {
    const [state] = reactive().state("count", 0).state("name", "John").join();
    expect(state.count).toBe(0);
    expect(state.name).toBe("John");
  });

  test("reactive.state(key, value) should return itself.", () => {
    const rx = reactive();
    expect(rx.state("count", 0)).toBe(rx);
  });

  test("reactive.state(key, value) should be able to update state with reactive.join().", () => {
    const [state] = reactive().state("count", 0).join();
    expect(state.count).toBe(0);
    state.count++;
    expect(state.count).toBe(1);
  });

  test("reactive.drive(key, fn) should return itself.", () => {
    const rx = reactive();
    expect(rx.computed("double", (s) => s.count * 2)).toBe(rx);
  });

  test("reactive.computed(key, fn) should define a derived state.", async () => {
    const [state] = reactive()
      .state("count", 0)
      .computed("double", (s) => s.count * 2)
      .join();

    expect(state.double).toBe(0);
    state.count++;
    await sleep(0);
    expect(state.double).toBe(2);
  });

  test("reactive.computed(key, fn) should only update one time when deps update.", async () => {
    const double = vi.fn((s) => s.count * 2);
    const [state] = reactive().state("count", 0).computed("double", double).join();
    state.count++;
    state.count++;
    await sleep(0);
    expect(double).toHaveBeenCalledTimes(0);
    expect(state.double).toBe(4);
    expect(double).toHaveBeenCalledTimes(1);
  });

  test("reactive.computed(key, fn) should define chained states.", async () => {
    const [state] = reactive()
      .state("count", 0)
      .computed("double", (s) => s.count * 2)
      .computed("triple", (s) => s.double * 3)
      .join();

    expect(state.triple).toBe(0);
    state.count++;
    await sleep(0);
    expect(state.triple).toBe(6);
  });

  test("reactive.computed(key, fn) don't care about the order of definitions.", async () => {
    const [state] = reactive()
      .computed("double", (s) => s.count * 2)
      .state("count", 0)
      .join();

    expect(state.double).toBe(0);
    state.count++;
    await sleep(0);
    expect(state.double).toBe(2);
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
    const [state] = reactive().state("count", 0).effect(effect).join();
    state.count++;
    state.count++;
    state.count++;
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
    const [, dispose] = reactive()
      .effect(() => d)
      .effect(() => d1)
      .join();
    expect(d).toHaveBeenCalledTimes(0);
    expect(d1).toHaveBeenCalledTimes(0);
    dispose();
    expect(d).toHaveBeenCalledTimes(1);
    expect(d1).toHaveBeenCalledTimes(1);
  });

  test("reactive.join() should return a reactive state.", () => {
    const [state] = reactive().state("count", 0).join();
    expect(state.count).toBe(0);
  });

  test("track(callback) should call callback at next animation frame.", async () => {
    const [state] = reactive().state("count", 0).join();

    const el = document.createElement("div");
    const update = vi.fn(() => (el.textContent = state.count));
    track(update);
    expect(el.outerHTML).toBe(`<div>0</div>`);
    expect(update).toHaveBeenCalledTimes(1);

    state.count++;
    expect(el.outerHTML).toBe(`<div>0</div>`);
    expect(update).toHaveBeenCalledTimes(1);
    await sleep(0);

    expect(el.outerHTML).toBe(`<div>1</div>`);
    expect(update).toHaveBeenCalledTimes(2);

    state.count++;
    await sleep(0);
    expect(el.outerHTML).toBe(`<div>2</div>`);
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("track(callback) should not call callback when state is not updated.", async () => {
    const [state] = reactive().state("count", 0).join();

    const el = document.createElement("div");
    const update = vi.fn(() => (el.textContent = state.count));
    track(update);
    expect(el.outerHTML).toBe(`<div>0</div>`);
    expect(update).toHaveBeenCalledTimes(1);

    state.count = 0;
    await sleep(0);

    expect(el.outerHTML).toBe(`<div>0</div>`);
    expect(update).toHaveBeenCalledTimes(1);
  });

  test("track(callback) should merge multiple updates into one.", async () => {
    const [state] = reactive().state("count", 0).join();

    const el = document.createElement("div");
    const update = vi.fn(() => (el.textContent = state.count));
    track(update);
    expect(el.outerHTML).toBe(`<div>0</div>`);
    expect(update).toHaveBeenCalledTimes(1);

    state.count++;
    state.count++;
    state.count++;
    await sleep(0);

    expect(el.outerHTML).toBe(`<div>3</div>`);
    expect(update).toHaveBeenCalledTimes(2);
  });

  test("track(callback) should track multiple states.", async () => {
    const [state] = reactive().state("count", 0).state("name", "John").join();

    const el = document.createElement("div");
    const update = vi.fn(() => (el.textContent = `${state.name} ${state.count}`));
    track(update);
    expect(el.outerHTML).toBe(`<div>John 0</div>`);
    expect(update).toHaveBeenCalledTimes(1);

    state.count++;
    await sleep(0);
    expect(el.outerHTML).toBe(`<div>John 1</div>`);
    expect(update).toHaveBeenCalledTimes(2);

    state.name = "Jane";
    await sleep(0);
    expect(el.outerHTML).toBe(`<div>Jane 1</div>`);
    expect(update).toHaveBeenCalledTimes(3);

    state.count++;
    state.name = "Jack";
    await sleep(0);
    expect(el.outerHTML).toBe(`<div>Jack 2</div>`);
    expect(update).toHaveBeenCalledTimes(4);
  });

  test("track(callback) should track multiple callbacks.", async () => {
    const [state] = reactive().state("count", 0).join();

    const el1 = document.createElement("div");
    const el2 = document.createElement("div");
    const update1 = vi.fn(() => (el1.textContent = state.count));
    const update2 = vi.fn(() => (el2.textContent = state.count));
    track(update1);
    track(update2);
    expect(el1.outerHTML).toBe(`<div>0</div>`);
    expect(el2.outerHTML).toBe(`<div>0</div>`);
    expect(update1).toHaveBeenCalledTimes(1);
    expect(update2).toHaveBeenCalledTimes(1);

    state.count++;
    await sleep(0);
    expect(el1.outerHTML).toBe(`<div>1</div>`);
    expect(el2.outerHTML).toBe(`<div>1</div>`);
    expect(update1).toHaveBeenCalledTimes(2);
    expect(update2).toHaveBeenCalledTimes(2);
  });

  test("track(callback) should track new deps caused by conditionally branches.", async () => {
    const [state] = reactive().state("count", 0).state("name", "jack").join();

    const span = document.createElement("span");
    const update = vi.fn(() => {
      if (state.count > 0) span.textContent = state.name;
    });
    track(update);
    expect(span.outerHTML).toBe(`<span></span>`);
    expect(update).toHaveBeenCalledTimes(1);

    state.name = "jane";
    await sleep(0);
    expect(span.outerHTML).toBe(`<span></span>`);
    expect(update).toHaveBeenCalledTimes(1); // Will not be called because name is not tracked.

    state.count++;
    await sleep(0);
    expect(span.outerHTML).toBe(`<span>jane</span>`);
    expect(update).toHaveBeenCalledTimes(2);

    state.name = "jim";
    await sleep(0);
    expect(span.outerHTML).toBe(`<span>jim</span>`);
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("track(callback) should prevent circular dependencies", async () => {
    const [state] = reactive().state("count", 0).state("checked", false).join();

    const toggle = vi.fn(() => (state.checked = !state.checked));
    const toggleTracked = () => track(toggle);

    const increment = vi.fn(() => state.checked && state.count++);
    track(increment);

    const reset = vi.fn(() => (state.count = 0));
    const resetTracked = () => track(reset);

    expect(state.count).toBe(0);

    toggleTracked();
    await sleep(0);
    expect(state.count).toBe(1);

    resetTracked(); // Will not trigger increment because of circular dependencies.
    await sleep(0);
    expect(state.count).toBe(0);
    expect(increment).toHaveBeenCalledTimes(2);
  });

  test("reactive() should remove deps without mounted DOMs when updating state.", async () => {
    const rx = reactive().state("count", 0);
    const [state] = rx.join();

    const el = document.createElement("div");
    document.body.appendChild(el);

    const update = vi.fn(() => {
      el.textContent = state.count;
      return el;
    });
    track(update);
    expect(rx.__states__.count.deps.size).toBe(1);

    state.count = 1;
    await sleep(0);
    expect(rx.__states__.count.deps.size).toBe(1);

    el.remove();
    state.count = 2;
    await sleep(0);
    expect(rx.__states__.count.deps.size).toBe(0);
  });

  test("reactive() should not remove deps with non-DOMs when updating state.", async () => {
    const rx = reactive().state("count", 0);
    const [state] = rx.join();

    const update = vi.fn(() => state.count);
    track(update);
    expect(rx.__states__.count.deps.size).toBe(1);

    state.count = 1;
    await sleep(0);
    expect(rx.__states__.count.deps.size).toBe(1);
  });

  test("reactive() should remove effect with disconnected DOM after 1s when getting the state.", async () => {
    const rx = reactive().state("count", 0);
    const [state] = rx.join();

    const el = document.createElement("div");
    document.body.appendChild(el);

    const update = vi.fn(() => {
      el.textContent = state.count;
      return el;
    });
    track(update);
    expect(rx.__states__.count.deps.size).toBe(1);

    el.remove();
    expect(rx.__states__.count.deps.size).toBe(1);

    state.count;
    expect(rx.__states__.count.deps.size).toBe(1);
    await sleep(1000);
    expect(rx.__states__.count.deps.size).toBe(0);
  });
});
