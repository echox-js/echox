import {test, expect, describe} from "vitest";
import {css, cx} from "../src/index.js";

describe("style", () => {
  test("css should convert style objects to CSS string", () => {
    expect(css({backgroundColor: "red"})).toBe("background-color: red");
    expect(css({backgroundColor: "red"}, {color: "blue"})).toBe("color: blue;background-color: red");
    expect(css({backgroundColor: "red"}, false && {color: "blue"})).toBe("background-color: red");
    expect(css({backgroundColor: "red"}, null)).toBe("background-color: red");
    expect(css({backgroundColor: "red"}, undefined)).toBe("background-color: red");
    expect(css({backgroundColor: "red"}, 0)).toBe("background-color: red");
    expect(css({backgroundColor: "red"}, "")).toBe("background-color: red");
    expect(css({backgroundColor: "red"}, [])).toBe("background-color: red");
    expect(css({backgroundColor: "red"}, {})).toBe("background-color: red");
    expect(css({backgroundColor: "red"}, new Date())).toBe("background-color: red");
  });

  test("cx should combine class names conditionally", () => {
    expect(cx("a", "b")).toBe("a b");
    expect(cx("a", false && "b", "c")).toBe("a c");
    expect(cx({a: true, b: false, c: true})).toBe("a c");
    expect(cx("a", {b: true, c: false, d: true})).toBe("a b d");
    expect(cx(null, "a", undefined, new Date(), {b: true}, {c: false, d: true, e: new Date()})).toBe("a b d e");
    expect(cx("a", null, undefined, 0, "", [], {})).toBe("a");
  });
});
