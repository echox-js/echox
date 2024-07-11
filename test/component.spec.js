import * as ex from "echox";
import {test, expect, vi} from "vitest";
import {withContainer} from "./container.js";
import {sleep} from "./sleep.js";

const {$} = ex;

test("component should store template in tag.", () => {
  const div = $.div()("hello world");
  const Div = ex.component(div);
  const app = Div();
  expect(app.tag[1]).toBe(div);
});

test("component should construct nested structure.", () => {
  const Div = ex.component($.div());
  const App = ex.component(Div()($.h1()("Hello, World!"), Div()($.p()("This is a test."))));
  const app = App();
  expect(app.tag[1].children[1].children[0].children[0]).toBe("This is a test.");
});

test("component should use state for attribute.", async () => {
  await withContainer((el) => {
    const App = ex.component(
      ex
        .reactive()
        .state("style", () => "color: red")
        .state("className", () => "test"),
      $.p({class: "test", style: (d) => d.style})("Hello World!"),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<p class="test" style="color: red;">Hello World!</p>`);
  });
});

test("component should use state for text nodes.", async () => {
  await withContainer((el) => {
    const App = ex.component(
      ex.reactive().state("test", () => "hello world"),
      $.p()((d) => d.test),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<p>hello world</p>`);
  });
});

test("component should use state for child component props.", async () => {
  await withContainer((el) => {
    const Hello = ex.component(ex.reactive().prop("style"), $.p({style: (d) => d.style})("Hello World!"));
    const App = ex.component(
      ex.reactive().state("style", () => "color: blue"),
      Hello({style: (d) => d.style}),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<p style="color: blue;">Hello World!</p>`);
  });
});

test("component should pass props.", async () => {
  await withContainer((el) => {
    const Hello = ex.component(
      ex.reactive().prop("style", () => "color: red"),
      $.p({style: (d) => d.style})("Hello World!"),
    );
    const App = ex.component($.div()(Hello({style: "color: blue"}), Hello()));
    ex.mount(el, App());
    expect(el.innerHTML).toBe(
      `<div><p style="color: blue;">Hello World!</p><p style="color: red;">Hello World!</p></div>`,
    );
  });
});

test("component should only use defined props.", async () => {
  await withContainer((el) => {
    const Hello = ex.component($.p({style: (d) => d.style})("Hello World!"));
    const App = ex.component($.div()(Hello({style: "color: blue"})));
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<div><p style="">Hello World!</p></div>`);
  });
});

test("component should bind state to attribute.", async () => {
  await withContainer(async (el) => {
    const style = vi.fn((d) => `background:${d.color}`);
    const color = vi.fn(() => "red");
    const App = ex.component(
      ex.reactive().state("color", color),
      ex.Fragment()(
        $.input({
          oninput: (d) => (e) => (d.color = e.target.value),
          value: (d) => d.color,
        }),
        $.p({style})("Hello World!"),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<input><p style="background: red;">Hello World!</p>`);
    expect(style.mock.calls.length).toBe(1);
    expect(color.mock.calls.length).toBe(1);

    const input = el.querySelector("input");
    input.value = "blue";
    input.dispatchEvent(new Event("input"));
    expect(style.mock.calls.length).toBe(1);

    await sleep();
    expect(style.mock.calls.length).toBe(2);
    expect(color.mock.calls.length).toBe(1);
    expect(el.innerHTML).toBe(`<input><p style="background: blue;">Hello World!</p>`);
  });
});

test("component should not computed unbind state.", async () => {
  await withContainer(async (el) => {
    const color = vi.fn(() => "red");
    const App = ex.component(ex.reactive().state("color", color), $.h1()("hello world"));
    ex.mount(el, App());
    expect(color.mock.calls.length).toBe(0);

    await sleep();
    expect(color.mock.calls.length).toBe(0);
  });
});

test("component should updated event handlers.", async () => {
  await withContainer(async (el) => {
    const count = vi.fn(() => 0);
    const increment = vi.fn(() => true);
    const App = ex.component(
      ex.reactive().state("count", count).state("increment", increment),
      ex.Fragment()(
        $.button({
          id: "button1",
          onclick: (d) => () => (d.increment = !d.increment),
        })("switch"),
        $.button({
          id: "button2",
          class: (d) => d.count,
          onclick: (d) => (d.increment ? () => d.count++ : () => d.count--),
        })("count"),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<button id="button1">switch</button><button id="button2" class="0">count</button>`);

    const button = el.querySelector("#button2");
    button.click();
    await sleep();

    expect(el.innerHTML).toBe(`<button id="button1">switch</button><button id="button2" class="1">count</button>`);

    const switchButton = el.querySelector("#button1");
    switchButton.click();
    await sleep();
    button.click();
    await sleep();

    expect(el.innerHTML).toBe(`<button id="button1">switch</button><button id="button2" class="0">count</button>`);
  });
});

test("component should only compute state once for multiple binds.", async () => {
  await withContainer(async (el) => {
    const className = vi.fn(() => "test");
    const App = ex.component(
      ex.reactive().state("class", className),
      ex.Fragment()($.h1({class: (d) => d.class})("hello"), $.h1({class: (d) => d.class})("world")),
    );
    ex.mount(el, App());
    expect(className.mock.calls.length).toBe(1);

    await sleep();
    expect(className.mock.calls.length).toBe(1);
  });
});

test("component should compute derived state.", async () => {
  await withContainer(async (el) => {
    const message = vi.fn(() => "test");
    const reversed = vi.fn((d) => d.message.split("").reverse().join(""));
    const App = ex.component(
      ex.reactive().state("message", message).state("reversed", reversed),
      ex.Fragment()($.h1({class: (d) => d.message})("hello"), $.h1({class: (d) => d.reversed})("world")),
    );
    ex.mount(el, App());
    expect(message.mock.calls.length).toBe(1);
    expect(reversed.mock.calls.length).toBe(1);
    expect(el.innerHTML).toBe(`<h1 class="test">hello</h1><h1 class="tset">world</h1>`);
  });
});

test("component should not compute derived state when not used.", async () => {
  await withContainer(async (el) => {
    const message = vi.fn(() => "test");
    const reversed = vi.fn((d) => d.message.split("").reverse().join(""));
    const App = ex.component(
      ex.reactive().state("message", message).state("reversed", reversed),
      $.h1({class: (d) => d.message})("hello"),
    );
    ex.mount(el, App());
    expect(message.mock.calls.length).toBe(1);
    expect(reversed.mock.calls.length).toBe(0);
  });
});

test("component should update derived state.", async () => {
  await withContainer(async (el) => {
    const message = vi.fn(() => "test");
    const reversed = vi.fn((d) => d.message.split("").reverse().join(""));
    const App = ex.component(
      ex.reactive().state("message", message).state("reversed", reversed),
      ex.Fragment()(
        $.input({
          oninput: (d) => (e) => (d.message = e.target.value),
          value: (d) => d.message,
        }),
        $.h1({class: (d) => d.reversed})("hello"),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<input><h1 class="tset">hello</h1>`);
    expect(message.mock.calls.length).toBe(1);
    expect(reversed.mock.calls.length).toBe(1);

    const input = el.querySelector("input");
    input.value = "world";
    input.dispatchEvent(new Event("input"));
    expect(message.mock.calls.length).toBe(1);
    expect(reversed.mock.calls.length).toBe(1);

    await sleep();
    expect(message.mock.calls.length).toBe(1);
    expect(reversed.mock.calls.length).toBe(2);
    expect(el.innerHTML).toBe(`<input><h1 class="dlrow">hello</h1>`);
  });
});

test("component should compute derived state with multiple dependencies in a batch.", async () => {
  await withContainer(async (el) => {
    const count = vi.fn(() => 0);
    const message = vi.fn(() => "test");
    const messageCount = vi.fn((d) => `${d.message} ${d.count}`);
    const App = ex.component(
      ex.reactive().state("count", count).state("message", message).state("messageCount", messageCount),
      ex.Fragment()(
        $.input({
          oninput: (d) => (e) => (d.message = e.target.value),
          value: (d) => d.message,
        }),
        $.button({onclick: (d) => () => (d.count += 1)})("Increment"),
        $.h1({class: (d) => d.messageCount})("hello"),
      ),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<input><button>Increment</button><h1 class="test 0">hello</h1>`);

    const input = el.querySelector("input");
    input.value = "world";
    input.dispatchEvent(new Event("input"));
    const button = el.querySelector("button");
    button.click();
    expect(messageCount.mock.calls.length).toBe(1);

    await sleep();
    expect(el.innerHTML).toBe(`<input><button>Increment</button><h1 class="world 1">hello</h1>`);
    expect(messageCount.mock.calls.length).toBe(2);
  });
});

test("component should track deps every update.", async () => {
  await withContainer(async (el) => {
    const count = vi.fn(() => 0);
    const message = vi.fn(() => "test");
    const App = ex.component(
      ex.reactive().state("count", count).state("message", message),
      ex.Fragment()(
        $.input({
          oninput: (d) => (e) => (d.message = e.target.value),
          value: (d) => d.message,
        }),
        $.button({onclick: (d) => () => (d.count += 1)})("Increment"),
        $.h1({class: (d) => (d.count > 0 ? d.message : "")})("hello"),
      ),
    );

    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<input><button>Increment</button><h1 class="">hello</h1>`);

    const button = el.querySelector("button");
    button.click();
    await sleep();
    expect(el.innerHTML).toBe(`<input><button>Increment</button><h1 class="test">hello</h1>`);

    const input = el.querySelector("input");
    input.value = "world";
    input.dispatchEvent(new Event("input"));
    await sleep();
    expect(el.innerHTML).toBe(`<input><button>Increment</button><h1 class="world">hello</h1>`);
  });
});

test("component should avoid self-referencing.", async () => {
  await withContainer(async (el) => {
    const count = vi.fn(() => 0);
    const App = ex.component(
      ex.reactive().state("count", count),
      $.button({
        onclick: (d) => () => d.count++,
        id: (d) => ++d.count,
      })("Increment"),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<button id="1">Increment</button>`);

    const button = el.querySelector("button");
    button.click();
    await sleep();
    expect(el.innerHTML).toBe(`<button id="1">Increment</button>`);
  });
});

test("component should update props.", async () => {
  await withContainer(async (el) => {
    const ColorLabel = ex.component(ex.reactive().prop("color"), $.span({style: (d) => `color: ${d.color}`})("label"));

    const App = ex.component(
      ex.reactive().state("color", () => "red"),
      ex.Fragment()(
        $.input({
          oninput: (d) => (e) => (d.color = e.target.value),
          value: (d) => d.color,
        }),
        ColorLabel({color: (d) => d.color}),
      ),
    );

    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<input><span style="color: red;">label</span>`);

    const input = el.querySelector("input");
    input.value = "blue";
    input.dispatchEvent(new Event("input"));
    await sleep();
    expect(el.innerHTML).toBe(`<input><span style="color: blue;">label</span>`);
  });
});

test("component should update text nodes.", async () => {
  const text = vi.fn((d) => (d.hello ? "hello" : "world"));
  await withContainer(async (el) => {
    const App = ex.component(
      ex.reactive().state("hello", () => true),
      ex.Fragment()($.button({onclick: (d) => () => (d.hello = !d.hello)})("switch"), $.p()(text)),
    );
    ex.mount(el, App());
    expect(el.innerHTML).toBe(`<button>switch</button><p>hello</p>`);

    const button = el.querySelector("button");
    button.click();
    await sleep();
    expect(el.innerHTML).toBe(`<button>switch</button><p>world</p>`);
    expect(text.mock.calls.length).toBe(2);
  });
});
