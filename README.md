# EchoX: UI = f(reactive, template)

The fast, 3KB JavaScript framework for "echoing" reactive UI in functional style.

- **Fast** - No Compiling, but Fine-tune Reactivity and No Virtual DOM Diff
- **Small** - Zero Dependencies, 3KB (gzip)
- **Simple** - 15 APIs, 1 Hour Learning
- **Productive** - Structural Code, but Nicely Reusable Logic and Flexible Organization of Concerns
- **Pragmatic** - No Transpiling, but Readable Template and Fully TS Support

> [!NOTE]
> The current next branch is implementing the new proposal API for production use. Please refer to the [main branch](https://github.com/echox-js/echox/tree/main) for the current release.

## Getting Started

EchoX is typically installed via a package manager such as Yarn or NPM.

```bash
$ npm install echox
```

EchoX can then imported as a namespace:

```js
import * as EchoX from "echox";

const {html} = EchoX;

const Counter = EchoX.component(
  EchoX.reactive()
    .let("value", 0)
    .let("increment", (d) => () => d.value++)
    .let("decrement", (d) => () => d.value--),
  html.div()(
    html.button({onclick: (d) => d.increment})("👍"),
    html.button({onclick: (d) => d.decrement})("👎"),
    html.span()((d) => d.value),
  ),
);

EchoX.mount(document.body, Counter());
```

EchoX is also available as a UMD bundle for legacy browsers.

```html
<script src="https://cdn.jsdelivr.net/npm/echox"></script>
<script>
  const {html} = EchoX;
</script>
```

Please reading the following core concepts to learn more:

- [DOM Building](#dom-building)
- [Component Mounting](#component-mounting)
- [Reactive Defining](#reactive-defining)
- [Style Bindings](#style-bindings)
- [Event Handling](#event-handling)
- [List Rendering](#list-rendering)
- [Conditional Rendering](#conditional-rendering)
- [Ref Bindings](#ref-bindings)
- [Composable Reactive](#composable-reactive)
- [Store Sharing](#store-sharing)

## DOM building

EchoX uses a dynamic object _html_ implemented with [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to building DOM:

```js
import {html} from "echox";

html.div({class: "title"})(
  html.span({style: "color:blue"})("Hello"),
  html.span()("World"),
  html.input({value: "EchoX"}),
);
```

<a name="echox-html" href="echox-html">#</a> _EchoX_.**html**._\<tag\>_(_[props]_)(_[...children]_)

_html.\<tag\>_ returns the tag function to create the specified tag template (not the real DOM). Calling the tag function to create the tag template with the specified _props_ (if any) and returns a function to specify the _children_ (if any) of the tag template. A child noe can be a tag template or a string.

## Component Mounting

A component is a piece of UI (user interface) that has its own logic and appearance which can be defined by [EchoX.component](#echox-component)

```js
const HelloWorld = EchoX.component(html.h1()("hello World"));
```

A component can be rendered and mount to the specified container by [EchoX.mount](#echox-mount):

```js
EchoX.mount(document.body, HelloWorld());
```

Then it can be removed and disposes allocated resources by [EchoX.unmount](#echox-unmount):

```js
EchoX.unmount(document.body);
```

<a name="echox-component" href="echox-component">#</a> _EchoX_.**component**([_reactive_,] template\_)

Returns a component with the specified reactive scope and template. If only one argument is specified, returns a component only with template.

<a name="echox-mount" href="echox-mount">#</a> _EchoX_.**mount**(_container_, _template_)

Mounts the specified _template_ into the specified _container_.

<a name="echox-unmount" href="echox-unmount">#</a> _EchoX_.**unmount**(_container_)

Unmounts the the specified _container_ with the mounted template.

## Reactive Defining

```js
 // Define primitive states
const Counter = EchoX.component(
  EchoX.reactive().let("value", 0),
  html.button({onclick: (d) => () => d.value++})((d) => d.value),
);
```

```js
// Define non-primitive states
const Person = EchoX.component(
  EchoX.reactive().let("person", () => ({name: "Jack", age: 24})),
  html.div(
    html.span()((d) => d.person.name),
    html.span()((d) => d.person.age),
  ),
);
```

```js
// Define computed states
const Message = EchoX.component(
  EchoX.reactive()
    .let("message", "hello world")
    .let("reversed", (d) => d.message.split("").reverse().join("")),
  html.div()(
    html.input({
      oninput: (d) => (e) => (d.message = e.target.value),
      value: (d) => d.message,
    }),
    html.span()((d) => d.reversed),
  ),
);
```

```js
// Define methods
const Counter = EchoX.component(
  EchoX.reactive()
    .let("value", 0)
    .let("increment", (d) => () => d.value++),
  html.button({onclick: (d) => d.increment})((d) => d.value),
);
```

```js
// Define props
const Red = EchoX.component(
  EchoX.reactive().get("text"),
  html.span({style: "color:red"})((d) => d.text),
);
```

```js
// Define effects
const Timer = EchoX.component(
  EchoX.reactive()
    .let("date", new Date())
    .call((d) => {
      const timer = setInterval(() => (d.date = new Date()), 1000);
      return () => clearInterval(timer);
    }),
  EchoX.span((d) => d.date.toLocaleString()),
);
```

## Style Bindings

Class and style are just like other properties:

```js
html.span({
  class: (d) => (d.random > 0.5 ? "red" : null),
  style: (d) => (d.random > 0.5 ? `background: ${d.color}` : null),
})("hello");
```

But [EchoX.cx](#echox-cx) and [EchoX.css](#echox-css) make it easier to style conditionally . With them, now say:

```js
html.span({
  class: (d) => EchoX.cx({red: d.random > 0.5}),
  style: (d) => EchoX.css(d.random > 0.5 && {background: d.color})
})("hello");
```

Multiple class objects and style objects can be specified and only truthy strings will be applied:

```js
// class: 'a b d'
html.span({
  class: EchoX.cx(null, "a", undefined, new Date(), {b: true}, {c: false, d: true, e: new Date()}),
});

// style: background: blue
html.span({
  style: EchoX.css({background: "red"}, {background: "blue"}, false && {background: "yellow"}),
});
```

<a name="echox-cx" href="echox-cx">#</a> _EchoX_.**cx**(_...classObjects_)

Returns a string joined by all the attribute names defined in the specified _classObjects_ with truthy string values.

<a name="echox-css" href="echox-css">#</a> _EchoX_.**css**(_...styleObjects_)

Returns a string joined by all the attributes names defined in the merged specified _styleObjects_ with truthy string values.

## Event Handling

```js
const Counter = EchoX.component(
  EchoX.reactive().let("value", 0),
  html.button({onclick: (d) => () => d.value++})((d) => d.value),
);
```

```js
const Counter = EchoX.component(
  EchoX.reactive().let("value", 0),
  html.button({onclick: EchoX.method((d) => d.value++)})((d) => d.value),
);
```

## List Rendering

```js
// Render a list
const List = EchoX.component(
  EchoX.reactive().let("list", () => [1, 2, 3]),
  html.ul()(
    EchoX.For({of: (d) => d.list})(
      html.li()((d, item) => item.index + ": " + item.val)
    )
  ),
);
```

```js
// Reactive updating
const List = EchoX.component(
  EchoX.reactive().let("list", () => [1, 2, 3]),
  html.div(
    html.button({onclick: (d) => () => (d.list[0] = 4)}),
    html.ul()(
      EchoX.For({of: (d) => d.list})(
        html.li()((d, item) => item.index + ": " + item.val)
      )
    ),
  ),
);
```

```js
// Reactive appending
const List = EchoX.component(
  EchoX.reactive().let("list", () => [1, 2, 3]),
  html.div(
    html.button({onclick: (d) => () => (d.list.push(4))}),
    html.ul()(
      EchoX.For({of: (d) => d.list})(
        html.li()((d, item) => item.index + ": " + item.val)
      )
    ),
  ),
);
```

```js
// Reactive removing
const List = EchoX.component(
  EchoX.reactive().let("list", () => [1, 2, 3]),
  html.div(
    html.button({onclick: (d) => () => (d.list.splice(1, 1))}),
    html.ul()(
      EchoX.For({of: (d) => d.list})(
        html.li()((d, item) => item.index + ": " + item.val)
      )
    ),
  ),
);
```

```js
// Reactive reversing
const List = EchoX.component(
  EchoX.reactive().let("list", () => [1, 2, 3]),
  html.div(
    html.button({onclick: (d) => () => (d.list.reverse())}),
    html.ul()(
      EchoX.For({of: (d) => d.list})(
        html.li()((d, item) => item.index + ": " + item.val)
      )
    ),
  ),
);
```

```js
// Reactive filtering
const List = EchoX.component(
  EchoX.reactive()
    .let("list", () => [1, 2, 3])
    .let("filtered", (d) => list.filter((val) => val % 2)),
  html.div(
    html.button({onclick: (d) => () => (d.list[0] = 4)}),
    html.ul()(
      EchoX.For({of: (d) => d.filtered})(
        html.li()((d, item) => item.index + ": " + item.val)
      )
    ),
  ),
);
```

## Conditional Rendering

```js
// Match with two arms
EchoX.Match({test: (d) => d.value > 0.5})(
  html.span()("Yes"),
  html.span()("No")
);
```

```js
// Match with multiple arms
EchoX.Match()(
  EchoX.Arm({test: (d) => d.type === "A"})(html.span("apple")),
  EchoX.Arm({test: (d) => d.type === "B"})(html.span("banana")),
  EchoX.Arm()(html.span("unknown")),
);
```

```js
// Switch-like Match
EchoX.Match({value: (d) => d.type})(
  EchoX.Arm({test: "A"})(html.span("apple")),
  EchoX.Arm({test: "B"})(html.span("banana")),
  EchoX.Arm()(html.span("unknown")),
);
```

## Ref Bindings

```js
// Accessing a DOM element.
EchoX.component(
  EchoX.reactive()
    .let("div", null)
    .call((d) => d.div && (d.div.textContent = "hello world")),
  html.div({[EchoX.ref]: "div"}),
);
```

```js
// Expose methods from state.
const Add = EchoX.component(
  EchoX.reactive()
    .get(EchoX.ref, null)
    .call((d) => (d[EchoX.ref] = (x, y) => x + y)),
  html.div()("Add"),
);

const App = EchoX.component(
  EchoX.reactive()
    .let("add", null)
    .let("sum", 0)
    .call((d) => d.add && (d.sum = d.add(1, 2))),
  EchoX.Fragment()(
    Add({[EchoX.ref]: "add"}),
    html.div()((d) => d.sum),
  ),
);
```

## Composable Reactive

```js
const mouse = EchoX.reactive()
  .get("x0", 0)
  .get("y0", 0)
  .let("x", (d) => d.x0 ?? 0)
  .let("y", (d) => d.y0 ?? 0)
  .call((d) => {
    const mousemove = (e) => ((d.x = e.clientX), (d.y = e.clientY));
    document.addEventListener("mousemove", mousemove);
    return () => document.removeEventListener("mousemove", mousemove);
  });

const App = EchoX.component(
  EchoX.reactive()
    .let("x0", 100)
    .let("y0", 100)
    .use("mouse", (d) => mouse.join({x0: d.x0, y0: d.y0})),
  html.div()((d) => `${d.mouse.x}, ${d.mouse.y}`),
);
```

## Store Sharing

```js
// store.js
export function createStore() {
  let store;
  return () => {
    if (store) return store;
    store = EchoX.reactive()
      .let("value", 0)
      .let("increment", (d) => () => d.value++)
      .join();
  };
}
```

```js
// counter.js
import {createStore} from "./store.js";

const Counter = EchoX.component(
  EchoX.reactive()
    .let("value", 0)
    .use("counter", () => createStore()),
  html.button({
    onclick: (d) => d.counter.increment,
  })((d) => d.counter.value),
);
```
