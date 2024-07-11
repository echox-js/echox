import {$} from "echox";
import {test, expect} from "vitest";

test(" $[tag]() should return node without props and children.", () => {
  const div = $.div();
  expect(div.tag).toBe("div");
  expect(div.props).toEqual({});
  expect(div.children).toEqual([]);
  expect(div.ns).toBeUndefined();
});

test(" $[tag]()() should return node without props and children.", () => {
  const div = $.div()();
  expect(div.tag).toBe("div");
  expect(div.props).toEqual({});
  expect(div.children).toEqual([]);
  expect(div.ns).toBeUndefined();
});

test(" $[tag](props) should return node with props.", () => {
  const div = $.div({id: "test"});
  expect(div.tag).toBe("div");
  expect(div.props).toEqual({id: "test"});
  expect(div.children).toEqual([]);
  expect(div.ns).toBeUndefined();
});

test(" $[tag]()(...children) should return node with children.", () => {
  const div = $.div()("hello", "world");
  expect(div.tag).toBe("div");
  expect(div.props).toEqual({});
  expect(div.children).toEqual(["hello", "world"]);
  expect(div.ns).toBeUndefined();
});

test(" $[tag](props)(...children) should return node with props and children.", () => {
  const div = $.div({id: "test"})("hello", "world");
  expect(div.tag).toBe("div");
  expect(div.props).toEqual({id: "test"});
  expect(div.children).toEqual(["hello", "world"]);
  expect(div.ns).toBeUndefined();
});

test(" $[tag] should build nested nodes.", () => {
  const div = $.div({id: "app"})($.h1()("Hello, World!"), $.p()("This is a test."));
  expect(div.tag).toBe("div");
  expect(div.props).toEqual({id: "app"});
  expect(div.children.length).toBe(2);
  expect(div.children[0].tag).toBe("h1");
  expect(div.children[0].props).toEqual({});
  expect(div.children[0].children).toEqual(["Hello, World!"]);
  expect(div.children[1].tag).toBe("p");
  expect(div.children[1].props).toEqual({});
  expect(div.children[1].children).toEqual(["This is a test."]);
});

test(" $(namespace)[tag] should return node with namespace.", () => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = $(ns);
  const circle = svg.circle({id: "test"})(svg.title()("Test"));
  expect(circle.tag).toBe("circle");
  expect(circle.ns).toBe(ns);
  expect(circle.props).toEqual({id: "test"});
  expect(circle.children[0].tag).toBe("title");
  expect(circle.children[0].props).toEqual({});
  expect(circle.children[0].children).toEqual(["Test"]);
  expect(circle.children[0].ns).toBe(ns);
});
