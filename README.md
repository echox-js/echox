# EchoX: UI = f(reactive, template)

The fast, 3KB JavaScript framework for "echoing" reactive UI in functional style.

- **Fast** - No Compiling, but Fine-tune Reactivity and No Virtual DOM Diff
- **Small** - Zero Dependencies, 3KB (gzip)
- **Simple** - 16 APIs, 1 Hour Learning
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

- [UI Describing](#ui-describing)
- [Component Mounting](#component-mounting)
- [Reactive Defining](#reactive-defining)
- [Style Bindings](#style-bindings)
- [Event Handling](#event-handling)
- [Control Flow](#control-flow)
- [Ref Bindings](#ref-bindings)
- [Stateful Reusing](#stateful-reusing)
- [Context Sharing](#context-sharing)
- [API Index](#api-index)

## UI Describing

EchoX uses a dynamic object _html_ implemented with [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to describing UI:

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

A component is a piece of UI (user interface) that has its own logic and appearance which can be defined by [EchoX.component](#echox-component):

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

<a name="echox-component" href="#echox-component">#</a> _EchoX_.**component**([_reactive_,] template\_)

Returns a component with the specified reactive scope and template. If only one argument is specified, returns a component only with template.

<a name="echox-mount" href="#echox-mount">#</a> _EchoX_.**mount**(_container_, _template_)

Mounts the specified _template_ into the specified _container_.

<a name="echox-unmount" href="#echox-unmount">#</a> _EchoX_.**unmount**(_container_)

Unmounts the the specified _container_ with the mounted template.

## Reactive Defining

```js
// Define primitive states.
const Counter = EchoX.component(
  EchoX.reactive().let("value", 0),
  html.button({onclick: (d) => () => d.value++})((d) => d.value),
);
```

```js
// Define non-primitive states.
const Person = EchoX.component(
  EchoX.reactive().let("person", () => ({name: "Jack", age: 24})),
  html.div(
    html.span()((d) => d.person.name),
    html.span()((d) => d.person.age),
  ),
);
```

```js
// Define computed states.
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
// Define methods.
const Counter = EchoX.component(
  EchoX.reactive()
    .let("value", 0)
    .let("increment", (d) => () => d.value++),
  html.button({onclick: (d) => d.increment})((d) => d.value),
);
```

```js
// Define props.
const Red = EchoX.component(
  EchoX.reactive().get("text"),
  html.span({style: "color:red"})((d) => d.text),
);
```

```js
// Define effects.
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

But [EchoX.cx](#echox-cx) and [EchoX.css](#echox-css) make it easier to style conditionally. With them, now say:

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

<a name="echox-cx" href="#echox-cx">#</a> _EchoX_.**cx**(_...classObjects_)

Returns a string joined by all the attribute names defined in the specified _classObjects_ with truthy string values.

<a name="echox-css" href="#echox-css">#</a> _EchoX_.**css**(_...styleObjects_)

Returns a string joined by all the attributes names defined in the merged specified _styleObjects_ with truthy string values.

## Event Handling

In tag function, you provide a _function_ value for property starting with _on_. This is a convenient way to specify event handlers. The specified function takes the reactive scope as the parameter and returns the event handler:

```js
const Input = EchoX.component(
  EchoX.reactive().let("text", "hello"),
  html.input({oninput: (d) => (e) => (d.text = e.target.value)}),
);
```

You can also define a method variable and bind it to an event handler.

```js
const Counter = EchoX.component(
  EchoX.reactive()
    .let("value", 0)
    .let("onclick", (d) => () => d.value++),
  html.button({onclick: (d) => d.onclick})((d) => d.value),
);
```

## Control Flow

Control Flow is the component to control the logic flow in the template, such as [conditional](#conditional-rendering) or [list rendering](#list-rendering).

### Conditional Rendering

The most basic control flow is [EchoX.\<Match\>](#echox-match), which is for conditional rendering. To handle boolean expression (_a && b_), wraps the component by _\<Match\>_ component with the _test_ attribute specified. If the specified _test_ function returns a truthy value, the wrapped component will be rendered, otherwise nothing.

```js
// Boolean expression.
EchoX.Match({test: (d) => d.value > 0.5})(
  html.span()("Hello World"),
);
```

To handle ternaries (_a ? b : c_) expression, wraps two components by _\<Match\>_ component with the _test_ attribute specified. If the specified _test_ function returns a truthy value, the first component will be rendered, otherwise the second.

```js
// Match with two arms.
EchoX.Match({test: (d) => d.value > 0.5})(
  html.span()("Yes"),
  html.span()("No")
);
```

To deal with conditionals with more than 2 mutual exclusive outcomes, wraps [EchoX.\<Arm\>](#echox-arm) by [EchoX.\<Match\>](#echox-match). Each _\<Arm\>_ component should be specified the test attribute. If the _test_ attribute is not specified, it defaults to _() => true_. The children of the first _\<Arm\>_ component whose _test_ function returns a truthy value will be rendered.

```js
// Match with multiple arms.
EchoX.Match()(
  EchoX.Arm({test: (d) => d.type === "A"})(html.span("apple")),
  EchoX.Arm({test: (d) => d.type === "B"})(html.span("banana")),
  EchoX.Arm()(html.span("unknown")),
);
```

It is also possible to define switch-like match:

```js
// Switch-like match.
EchoX.Match({value: (d) => d.type})(
  EchoX.Arm({test: "A"})(html.span("apple")),
  EchoX.Arm({test: "B"})(html.span("banana")),
  EchoX.Arm()(html.span("unknown")),
);
```

<a name="echox-match" href="#echox-match">#</a> _EchoX_.**\<Match\>**

The control flow for list rendering. With the _test_ attribute being specified, renders the first child if the _test_ function returns a truthy value, otherwise the second child. With the _test_ attribute not being specified, renders the children of the first _\<Arm\>_ component with the truthy _test_ attribute.

<a name="echox-arm" href="#echox-arm">#</a> _EchoX_.**\<Arm\>**

The control flow for defining one outcome for Match control flow. If the _test_ attribute is not specified, it defaults to _() => true_. The children of it will be rendered if it is the first _\<Arm\>_ component with the truthy _test_ attribute for its parent _\<Match\>_ component.

### List Rendering

```js
// Render a list.
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
// Reactive updating.
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
// Reactive appending.
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
// Reactive removing.
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
// Reactive reversing.
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
// Reactive filtering.
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

### Fragment wrapping

[EchoX.\<Fragment\>](ehcox-fragment) is the control flow to group a list of children without adding extra nodes to DOM.

```js
EchoX.component(
  EchoX.Fragment()(
    html.h1()("Hello, World!"),
    html.p()("This is a test.")
  )
);
```

<a name="echox-fragment" href="#echox-fragment">#</a> _EchoX_.**\<Fragment\>**

The control flow for grouping a list of children without adding extra nodes to DOM.

### Slot Forwarding

[EchoX.\<Slot\>](ehcox-Slot) is the control flow to pass a template fragment to a child component, and let the child component render the fragment within its own template.

_\<Slot\>_ is a slot outlet that renders the template specified by the _from_ property. For example, to render the child component from the parent:

```js
// Slots from children.
const Div = EchoX.component(
  html.div()(
    EchoX.Slot({from: (d) => d.children})
  )
);

const App = EchoX.component(
  Div()(
    html.h1()("Hello, World!"),
    Div()(
      html.p()("This is a test.")
    )
  )
);
```

The children of _\<Slot\>_ will be rendered if the _from_ property is a falsy value, which is considered as the fallback content:

```js
// Slots with fallback content.
const Div = EchoX.component(
  html.div()(
    EchoX.Slot({from: (d) => d.children})(
      html.h1()("Hello, World!")
    )
  )
);

const App = EchoX.component(Div());
```

It also possible to define some named slot to render template props other than _children_:

```js
// Named slots.
const Layout = EchoX.component(
  EchoX.reactive().get("header").get("body").get("footer"),
  html.div()(
    html.div()(EchoX.Slot({from: (d) => d.header})),
    html.div()(EchoX.Slot({from: (d) => d.body})),
    html.div()(EchoX.Slot({from: (d) => d.footer})),
  ),
);

const App = EchoX.component(
  Layout({
    header: html.h1()("Header"),
    body: html.p()("Body"),
    footer: html.h2()("Footer"),
  }),
);
```

<a name="echox-slot" href="#echox-slot">#</a> _EchoX_.**\<Slot\>**

The control flow for passing a template fragment to a child component, and let the child component render the fragment specified by _from_ property within its own template. If the _from_ property is a falsy value, the children of _\<Slot\>_ will be rendered.

## Ref Bindings

Ref is particularly common used to manipulate the DOM. First declare a variable with [reactive.let](#reactive-let), then a pass a binding function as the _ref_ attribute to the DOM you want to manipulate. Then binding function returns a setter which take the DOM element as the parameter.

```js
// Manipulate a DOM element.
EchoX.component(
  EchoX.reactive()
    .let("divRef", null)
    .call((d) => d.divRef && (d.divRef.textContent = "hello world")),
  html.div({ref: (d) => (el) => (d.divRef = el)}),
);
```

Instead of manipulating a DOM element, you can expose a custom handle from a component. To do this, you'd need to assign the handle to the _ref_ props for the component. And then pass a binding function as _ref_ attribute to the component.

```js
// Exposes imperative handle from component.
const MyInput = EchoX.component(
  EchoX.reactive()
    .let("inputRef", null)
    .call((d) => {
      d.ref = {
        focus: () => d.inputRef.current.focus(),
        scrollIntoView: () => d.inputRef.current.scrollIntoView(),
      };
    }),
  html.input({ref: (d) => (el) => (d.inputRef = el)}),
);

const Form = EchoX.component(
  EchoX.reactive()
    .let("inputRef", null)
    .let("handleClick", (d) => () => d.inputRef.focus()),
  MyInput({ref: (d) => (handle) => (d.inputRef = handle)}),
);
```

## Stateful Reusing

A stateful reactive scope is reusable by binding to a existing reactive scope with the specified namespace. Make sure to call _reactive.join_ to create a new reactive scope with the specified props:

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
    .let("mouse", (d) => mouse.join({x0: d.x0, y0: d.y0})),
  html.div()((d) => `${d.mouse.x}, ${d.mouse.y}`),
);
```

<a name="reactive-join" href="reactive-join">#</a> _reactive_.**join**(_[props]_)

Instantiates a reactive scope with the specified _props_.

## Context Sharing

A single instance stateful reactive scope can be shared by binding to a existing reactive scope with the specified namespace.

```js
// context.js
export function createContext() {
  let context;
  return () => {
    if (context) return context;
    context = EchoX.reactive()
      .let("value", 0)
      .let("increment", (d) => () => d.value++)
      .join();
  };
}
```

```js
// counter.js
import {createContext} from "./context.js";

const Counter = EchoX.component(
  EchoX.reactive()
    .let("value", 0)
    .let("counter", () => createContext()),
  html.button({
    onclick: (d) => d.counter.increment,
  })((d) => d.counter.value),
);
```

## API Index

- [EchoX.**\<Arm\>**](#echox-arm) - arms for Match
- [EchoX.**component**](#echox-component) - defining piece of reusable UI
- [EchoX.**css**](#echox-css) - defining conditional styles
- [EchoX.**cx**](#echox-cx) - defining conditional class names
- [EchoX.**\<For\>**](#echox-For) - rendering list
- [EchoX.**\<Fragment\>**](#echox-fragment) - rendering nodes without wrapping nodes
- [EchoX.**html**](#echox-html) - describing UI functionally
- [EchoX.**\<Match\>**](#echox-match) - rendering conditionally
- [EchoX.**mount**](#echox-mount) - mounting DOM
- [EchoX.**reactive**](#echox-reactive) - returning a reactive scope
- [reactive.**get**](#reactive-get) - receiving props
- [reactive.**let**](#reactive-let) - defining a state, derived state, method
- [reactive.**call**](#reactive-call) - calling a effect
- [reactive.**join**](#reactive-join) - instantiating a reactive scope
- [EchoX.**<\Slot\>**](#echox-slot) - pass template to child component
- [EchoX.**unmount**](#echox-unmount) - destroying DOM and clearing allocated resources
