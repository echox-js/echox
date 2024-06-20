import Echo from "echox";
import {test, expect} from "vitest";

test("reactive() should a join function", () => {
  const join = Echo.reactive();
  expect(join).toBeTypeOf("function");
});

test("reactive()() should return defaults reactive", () => {
  const ctx = Echo.reactive()();
  expect(ctx).toEqual({});
});

test("reactive().prop() should define a default prop", () => {
  const ctx = Echo.reactive();
  const ctx2 = ctx.prop("test", () => "hello");
  expect(ctx).toBe(ctx2);
});

test("reactive.state() should effect a state", () => {
  const ctx = Echo.reactive();
  const ctx2 = ctx.state("test", () => "hello");
  expect(ctx).toBe(ctx2);
});
