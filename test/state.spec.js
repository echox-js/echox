import {it, expect, vi} from "vitest";
import * as X from "echox";
import {format} from "./format.js";
import {nextTick} from "./nexTick.js";

it("state(string) should be able to interpolate text.", () => {
  const node = X.html`<span x-text=${X.state("hello")}>message: ${(d) => d.text}</span>`;
  expect(node.outerHTML).toBe("<span>message: hello</span>");
  node.destroy();
});

it("state(string) should be able to interpolate text with other state.", () => {
  const node = X.html`<span x-text=${X.state("hello")}>message: ${(d) => d.text}${(d) => d.text}</span>`;
  expect(node.outerHTML).toBe("<span>message: hellohello</span>");
  node.destroy();
});

it("state(value) should be able to bind with attribute.", () => {
  const node = X.html`<span x-bg=${X.state("red")} style=${(d) => `background:${d.bg}`}>message</span>`;
  expect(node.outerHTML).toBe(`<span style="background:red">message</span>`);
  node.destroy();
});

it("state(value) should be able to bind in attribute.", () => {
  const node = X.html`<span x-bg=${X.state("red")} x-fs=${X.state(20)} style="background:${(d) => d.bg};font-size:${(d) => d.fs}px">message</span>`;
  expect(node.outerHTML).toBe(`<span style="background:red;font-size:20px">message</span>`);
  node.destroy();
});

it("state(truthy) should be able to bind with boolean attribute.", () => {
  const node = X.html`<input x-checked=${X.state(true)} checked=${(d) => d.checked}>`;
  expect(node.outerHTML).toBe(`<input checked="true">`);
  node.destroy();
});

it("state(falsy) should be able to bind with boolean attribute.", () => {
  const node = X.html`<input x-checked=${X.state(false)} checked=${(d) => d.checked}>`;
  expect(node.outerHTML).toBe(`<input checked="false">`);
  node.destroy();
});

it("state(string) should be able to update bind text.", async () => {
  const text = vi.fn((d) => d.value);
  const node = X.html`<div x-value=${X.state(0)}>
    <button $click=${(d) => d.value++}>👍</button>
    <span>${text}</span>
  </div>`;
  document.body.appendChild(node);

  expect(format(node.outerHTML)).toBe("<div><button>👍</button><span>0</span></div>");
  expect(text.mock.calls.length).toBe(1);

  const button = node.querySelector("button");
  const span = node.querySelector("span");
  button.click();
  await nextTick();
  expect(text.mock.calls.length).toBe(2);
  expect(span.textContent).toBe("1");
  expect(format(node.outerHTML)).toBe("<div><button>👍</button><span>1</span></div>");

  button.click();
  await nextTick();
  expect(text.mock.calls.length).toBe(3);
  expect(span.textContent).toBe("2");
  expect(format(node.outerHTML)).toBe("<div><button>👍</button><span>2</span></div>");

  node.destroy();
});

it("state(string) should be able to update bind attribute.", async () => {
  const bg = vi.fn((d) => `background:${d.bg}`);
  const value = vi.fn((d) => d.bg);
  const node = X.html`<div x-bg=${X.state("red")}>
    <input value=${value} $input=${(d, e) => (d.bg = e.target.value)} />
    <span style=${bg}>message</span>
  </div>`;
  document.body.appendChild(node);

  expect(format(node.outerHTML)).toBe(`<div><input value="red"><span style="background:red">message</span></div>`);
  expect(bg.mock.calls.length).toBe(1);
  expect(value.mock.calls.length).toBe(1);

  const input = node.querySelector("input");
  const span = node.querySelector("span");

  input.value = "blue";
  input.dispatchEvent(new Event("input"));
  await nextTick();
  expect(bg.mock.calls.length).toBe(2);
  expect(value.mock.calls.length).toBe(2);
  expect(span.style.background).toBe("blue");
  expect(format(node.outerHTML)).toBe(`<div><input value="blue"><span style="background:blue">message</span></div>`);

  input.value = "green";
  input.dispatchEvent(new Event("input"));
  await nextTick();
  expect(bg.mock.calls.length).toBe(3);
  expect(value.mock.calls.length).toBe(3);
  expect(span.style.background).toBe("green");
  expect(format(node.outerHTML)).toBe(`<div><input value="green"><span style="background:green">message</span></div>`);

  input.value = "green";
  input.dispatchEvent(new Event("input"));
  await nextTick();
  expect(bg.mock.calls.length).toBe(3);
  expect(value.mock.calls.length).toBe(3);
  expect(span.style.background).toBe("green");
  expect(format(node.outerHTML)).toBe(`<div><input value="green"><span style="background:green">message</span></div>`);

  node.destroy();
});

it("state(function) should merge multiple updates.", async () => {
  const text = vi.fn((d) => d.value);
  const node = X.html`<div x-value=${X.state(0)}>
    <button $click=${(d) => (d.value++, d.value++)}>👍</button>
    <span>${text}</span>
  </div>`;
  document.body.appendChild(node);

  expect(format(node.outerHTML)).toBe("<div><button>👍</button><span>0</span></div>");
  expect(text.mock.calls.length).toBe(1);

  const button = node.querySelector("button");
  const span = node.querySelector("span");
  button.click();
  await nextTick();
  expect(text.mock.calls.length).toBe(2);
  expect(span.textContent).toBe("2");
  expect(format(node.outerHTML)).toBe("<div><button>👍</button><span>2</span></div>");

  node.destroy();
});

it("state(function) should define a computed state.", async () => {
  const preversed = vi.fn((d) => d.reversed);
  const node = X.html`<div 
    x-message=${X.state("hello")}
    x-reversed=${X.state((d) => d.message.split("").reverse().join(""))}
  >
    <p>${(d) => d.message}</p>
    <p>${preversed}</p>
  </div>`;
  document.body.appendChild(node);
  await nextTick();

  expect(preversed.mock.calls.length).toBe(1);
  expect(format(node.outerHTML)).toBe("<div><p>hello</p><p>olleh</p></div>");

  node.destroy();
});

it("state(function) should update a computed state only when dependents updating.", async () => {
  const reversed = vi.fn((d) => d.message.split("").reverse().join(""));
  const pmessage = vi.fn((d) => d.message);
  const preversed = vi.fn((d) => d.reversed);
  const node = X.html`<div 
    x-message=${X.state("hello")}
    x-reversed=${X.state(reversed)}
  >
    <input value=${(d) => d.message} $input=${(d, e) => (d.message = e.target.value)} />
    <p>${pmessage}</p>
    <p>${preversed}</p>
  </div>`;
  document.body.appendChild(node);
  await nextTick();

  expect(format(node.outerHTML)).toBe(`<div><input value="hello"><p>hello</p><p>olleh</p></div>`);
  expect(reversed.mock.calls.length).toBe(1);
  expect(pmessage.mock.calls.length).toBe(1);
  expect(preversed.mock.calls.length).toBe(1);

  const input = node.querySelector("input");

  input.value = "world";
  input.dispatchEvent(new Event("input"));
  await nextTick();
  expect(pmessage.mock.calls.length).toBe(2);
  expect(preversed.mock.calls.length).toBe(2);
  expect(reversed.mock.calls.length).toBe(2);
  expect(format(node.outerHTML)).toBe(`<div><input value="world"><p>world</p><p>dlrow</p></div>`);

  input.value = "echox";
  input.dispatchEvent(new Event("input"));
  await nextTick();
  expect(format(node.outerHTML)).toBe(`<div><input value="echox"><p>echox</p><p>xohce</p></div>`);
  expect(reversed.mock.calls.length).toBe(3);

  input.value = "echox";
  input.dispatchEvent(new Event("input"));
  await nextTick();
  expect(format(node.outerHTML)).toBe(`<div><input value="echox"><p>echox</p><p>xohce</p></div>`);
  expect(reversed.mock.calls.length).toBe(3);

  input.value = "world";
  input.dispatchEvent(new Event("input"));
  await nextTick();
  expect(format(node.outerHTML)).toBe(`<div><input value="world"><p>world</p><p>dlrow</p></div>`);
  expect(reversed.mock.calls.length).toBe(4);

  node.destroy();
});

it("state(function) should be able to depend on computed state.", async () => {
  const reversed = vi.fn((d) => d.message.split("").reverse().join(""));
  const uppercased = vi.fn((d) => d.reversed.toUpperCase());
  const node = X.html`<div 
    x-message=${X.state("hello")}
    x-reversed=${X.state(reversed)}
    x-uppercased=${X.state(uppercased)}
  >
    <input value=${(d) => d.message} $input=${(d, e) => (d.message = e.target.value)} />
    <p>${(d) => d.message}</p>
    <p>${(d) => d.reversed}</p>
    <p>${(d) => d.uppercased}</p>
  </div>`;
  document.body.appendChild(node);
  await nextTick();

  expect(format(node.outerHTML)).toBe(`<div><input value="hello"><p>hello</p><p>olleh</p><p>OLLEH</p></div>`);
  expect(reversed.mock.calls.length).toBe(1);
  expect(uppercased.mock.calls.length).toBe(1);

  const input = node.querySelector("input");

  input.value = "world";
  input.dispatchEvent(new Event("input"));
  await nextTick();
  expect(format(node.outerHTML)).toBe(`<div><input value="world"><p>world</p><p>dlrow</p><p>DLROW</p></div>`);
  expect(reversed.mock.calls.length).toBe(2);
  expect(uppercased.mock.calls.length).toBe(2);

  node.destroy();
});

it("state(function) should be able to depend on multiple states.", async () => {
  const message = vi.fn((d) => `${d.name} is ${d.age} years old.`);
  const node = X.html`<div
    x-name=${X.state("echox")}
    x-age=${X.state(0)}
    x-message=${X.state(message)}
  >
    <button $click=${(d) => d.age++}>🎂</button>
    <input value=${(d) => d.name} $input=${(d, e) => (d.name = e.target.value)} />
    <p>${(d) => d.message}</p>
  </div>`;
  document.body.appendChild(node);
  await nextTick();

  expect(format(node.outerHTML)).toBe(
    `<div><button>🎂</button><input value="echox"><p>echox is 0 years old.</p></div>`,
  );
  expect(message.mock.calls.length).toBe(1);

  const input = node.querySelector("input");
  const button = node.querySelector("button");

  input.value = "john";
  input.dispatchEvent(new Event("input"));
  await nextTick();
  expect(format(node.outerHTML)).toBe(`<div><button>🎂</button><input value="john"><p>john is 0 years old.</p></div>`);
  expect(message.mock.calls.length).toBe(2);

  button.click();
  await nextTick();
  expect(format(node.outerHTML)).toBe(`<div><button>🎂</button><input value="john"><p>john is 1 years old.</p></div>`);
  expect(message.mock.calls.length).toBe(3);

  button.click();
  input.value = "jane";
  input.dispatchEvent(new Event("input"));
  await nextTick();
  expect(format(node.outerHTML)).toBe(`<div><button>🎂</button><input value="jane"><p>jane is 2 years old.</p></div>`);
  expect(message.mock.calls.length).toBe(4);

  input.value = "jane";
  input.dispatchEvent(new Event("input"));
  await nextTick();
  expect(format(node.outerHTML)).toBe(`<div><button>🎂</button><input value="jane"><p>jane is 2 years old.</p></div>`);
  expect(message.mock.calls.length).toBe(4);

  node.destroy();
});
