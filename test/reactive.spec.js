import * as EchoX from "echox";
import {test, expect} from "vitest";

test("reactive().join() should return defaults reactive", () => {
  const ctx = EchoX.reactive().join();
  const keys = Object.keys(ctx);
  expect(keys.length).toBe(0);
});

test("reactive().prop() should define a default prop", () => {
  const ctx = EchoX.reactive();
  const ctx2 = ctx.prop("test", () => "hello");
  expect(ctx).toBe(ctx2);
});

test("reactive.state() should effect a state", () => {
  const ctx = EchoX.reactive();
  const ctx2 = ctx.state("test", () => "hello");
  expect(ctx).toBe(ctx2);
});

test("reactive.effect() should define an effect", () => {
  const ctx = EchoX.reactive();
  const ctx2 = ctx.effect(() => {});
  expect(ctx).toBe(ctx2);
});
