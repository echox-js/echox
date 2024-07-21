import * as EchoX from "echox";
import {test, expect} from "vitest";

test("reactive().join() should return defaults reactive", () => {
  const ctx = EchoX.reactive().join();
  const keys = Object.keys(ctx);
  expect(keys.length).toBe(0);
});

test("reactive().get() should define a default prop", () => {
  const ctx = EchoX.reactive();
  const ctx2 = ctx.get("test", () => "hello");
  expect(ctx).toBe(ctx2);
});

test("reactive.let() should effect a state", () => {
  const ctx = EchoX.reactive();
  const ctx2 = ctx.let("test", () => "hello");
  expect(ctx).toBe(ctx2);
});

test("reactive.call() should define an effect", () => {
  const ctx = EchoX.reactive();
  const ctx2 = ctx.call(() => {});
  expect(ctx).toBe(ctx2);
});

test("reactive.use() should defined a scope", () => {
  const ctx = EchoX.reactive();
  const ctx2 = ctx.use(() => {});
  expect(ctx).toBe(ctx2);
});
