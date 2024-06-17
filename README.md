# EchoX

The fast, 3KB JavaScript framework for "echoing" reactive UI with tagged templates, inspired by [Hypertext Literal](https://github.com/observablehq/htl).

- **Fast** - no virtual DOM, no extensive diffing, pure fine-grained reactivity
- **Small** - no transpiling or compiling, zero dependencies, 3KB (gzip)
- **Simple** - as simple as innerHTML

> [!NOTE]
> The current release is merely a proof of concept and is not ready for production. The [next branch](https://github.com/pearmini/echox/tree/next) is implementing the [new proposal API](https://github.com/pearmini/echox/discussions/1) for production use. Feel free to join the discussion and contribute!

## Getting Started

EchoX is typically installed via a package manager such as Yarn or NPM.

```bash
$ npm install echox
```

EchoX can then imported as a namespace:

```js
import * as X from "echox";

const node = X.html`<define count=${X.state(0)}>
  <button @click=${(d) => d.count++}>👍</button>
  <button @click=${(d) => d.count--}>👎</button>
  <span>${(d) => d.count}</span>
</define>`;

document.body.append(node);
```

EchoX is also available as a UMD bundle for legacy browsers.

```html
<script src="https://cdn.jsdelivr.net/npm/echox"></script>
<script>
  const node = X.html`...`;

  document.body.append(node);
</script>
```

Reading the core concepts to learn more:

- [Template Interpolations](#template-interpolations)
- [State Bindings](#state-bindings)
- [Class and Style Bindings](#class-and-style-bindings)
- [Event Handling](#event-handling)
- [List Rendering](#list-rendering)
- [Conditional Rendering](#conditional-rendering)
- [Effect](#effect)
- [Ref Bindings](#ref-bindings)
- [Component](#component)
- [Composable](#composable)
- [Store](#store)

## Template Interpolations

EchoX uses tagged template literal to declare UI, which renders the specified markup as an element.

```js
import * as X from "echox";

const node = X.html`<h1>hello world</h1>`;

document.body.append(node);
```

A string, boolean, null, undefined can be interpolated to an attribute:

```js
// Interpolate number attribute.
X.html`<h1 id=${"id" + Math.random()}></h1>`;

// Interpolate boolean attribute.
X.html`<input checked=${true}></input>`;
```

If the interpolated data value is a node, it is inserted into the result at the corresponding location.

```js
X.html`<h1>${document.createText('hello world')}</h1>
```

It is also possible to interpolate iterables of nodes into element.

```js
X.html`<ul>${["A", "B", "C"].map((d) => X.html`<li>${d}</li>`)}</ul>`;
```

<a name="x-html" href="x-html">#</a> _X_.**html**(_markup_, _...interpolations_)

If only one arguments is specified, render and return the specified [component](x-component). Otherwise tenders the specified _markups_ and _interpolations_ as an element.

## State Bindings

For stateful UI, a wrapped _define_ tag is required for defining some properties related to reactivity. Each state-derived property or child node should be specified as a **callback**, which is invoked on an object containing all the properties defined on the _define_ tag.

```js
// state-derived property
X.html`<define count=${X.state(0)}>
  <span>${(d) => d.count}</span>
  <button @click=${(d) => d.count++}></button>
</define>`;

// state-derived child node
X.html`<define color=${X.state(0)}>
  <span style=${(d) => `background: ${d.color}`}>hello</span>
  <input value=${(d) => d.color} @input=${(d, e) => (d.color = e.target.value)} />
</define>`;
```

If a state is non-primitive, it should be specified as a _callback_ returning the state.

```js
// array state
X.html`<define letters=${X.state(() => ["A", "B", "C"])}></define>`;

// object state
X.html`<define info=${X.state(() => ({name: "jim", age: 22}))}></define>`;
```

A computed state also can be specified as a _callback_, calling on all reactive properties and return a new state.

```js
X.html`<define message=${X.state("hello")} reversed=${X.state((d) => d.message.split("").reverse().join(""))}>
  <input value=${(d) => d.message} @input=${(d, e) => (d.message = e.target.value)} />
  <p>Reversed: ${(d) => d.reversed}</p>
</define>`;
```

Please notes that the name of a reactive property must be **kebab case** in defined tag, but convert to camel case when accessing.

```js
X.html`<define must-kebab-case=${X.state("hi")}>${(d) => d.museKebabCase}</define>`;
```

<a name="x-state" href="#x-state">#</a> _X_.**state**(_value_)

Returns a state.

## Class and Style Bindings

Class and style are just like other properties:

```js
X.html`<define random=${Math.random()} >
  <span 
    class=${(d) => (d.random > 0.5 ? "red" : null)}
    style=${(d) => (d.random > 0.5 ? `background: ${d.color}` : null)}
  >
    hello
  </span>
</define>`;
```

But [X.cx](#x-cx) and [X.css](#x-css) make it easier to style conditionally . With them, now say:

```js
X.html`<define random=${Math.random()} >
  <span
    class=${(d) => X.cx({red: d.random > 0.5})}
    style=${(d) => X.css(d.random > 0.5 && {background: d.color})}
  >
    hello
  </span>
</define>`;
```

Multiple class objects and style objects can be specified and only truthy strings will be applied:

```js
// class: 'a b d'
// style: background: blue
X.html`<define>
  <span class=${X.cx(null, "a", undefined, new Date(), {b: true}, {c: false, d: true, e: new Date()})}> Hello </span>
  <span style=${X.css({background: "red"}, {background: "blue"}, false && {background: "yellow"})}> World </span>
</define>`;
```

<a name="x-cx" href="x-cx">#</a> _X_.**cx**(_...classObjects_)

Returns a string joined by all the attribute names defined in the specified _classObjects_ with truthy string values.

<a name="x-css" href="x-css">#</a> _X_.**css**(_...styleObjects_)

Returns a string joined by all the attributes names defined in the merged specified _styleObjects_ with truthy string values.

## Event Handling

Using _@_ directive to bind a event with the _specified_ event handler, which is calling on all _reactive properties_ and native _event object_.

```js
X.html`<define count=${X.state(0)}>
  <button @click=${(d) => d.count++}>👍</button>
  <button @click=${(d) => d.count--}>👎</button>
  <span>${(d) => d.count}</span>
</define>`;

// Event is the second parameter.
X.html`<define color=${X.state(0)}>
  <span style=${(d) => `background: ${d.color}`}>hello</span>
  <input value=${(d) => d.color} @input=${(d, e) => (d.color = e.target.value)} />
</define>`;
```

## List Rendering

Memorized list rendering is achieved by _for_ tag. The _each_ property is required in _for_ tag to specify the iterable state. Some rest item parameters are called on the stateful binds in _for_ tag, accessing item and index by _item.$value_ and _item.$index_ respectively.

```js
X.html`<define dark=${state(false)} blocks=${state([1, 2, 3])}>
  <ul>
    <for each=${(d) => d.blocks}>
      <li>${(d, item) => item.$index}-${item.$value}</li>
    </for>
  </ul>
</define>`;
```

## Conditional Rendering

Memorized conditional rendering is achieved by _if_, _elif_ and _else_ tags. The _expr_ property is required in _if_ and _elif_ tags, displaying the child nodes with the specified callback evaluating to true.

```js
X.html`<define count=${state(0)} random=${state(Math.random())}>
  <if expr=${(d) => d.random < 0.3}>
    <span>A</span>
  </if>
  <elif expr="${(d) => d.random < 0.6}}">
    <span>B</span>
  </elif>
  <else>
    <span>C</span>
  </else>
</define>`;
```

## Effect

Effects can be defined using [X.effect](#x-effect), which is be called before DOM elements are mounted and after dependent states are updated. An optional callback can be returned to dispose of allocated resources.

```js
const f = (d) => ("0" + d).slice(-2);

X.html`<define
  date=${X.state(new Date())}
  ${X.effect(() => console.log(`I'm a new time component.`))}
  ${X.effect((d) => {
    const timer = setInterval(() => (d.date = new Date()), 1000);
    return () => clearInterval(timer);
  })}
  >
  <span>${({date}) => `${f(date.getHours())}:${f(date.getMinutes())}:${f(date.getSeconds())}`}</span>
</define>`;
```

<a name="x-effect" href="x-effect">#</a> _X_.**effect**(_effect_)

Returns a effect.

## Ref Bindings

Accessing a DOM element in effect.

```js
X.html`<define
  div=${X.ref()}
  ${X.effect((d) => d.div && (d.div.textContent = "hello"))}
>
  <div ref="div"></div>
</define>`;
```

<a name="x-effect" href="x-effect">#</a> _X_.**ref**()

Returns a ref.

## Component

A component can be defined a component using [X.component](x-component) and registered it in _define_ tag. Please notes that the name of component should always be kebab case.

```js
const ColorLabel = X.component`<define color=${X.prop("steelblue")} text=${X.prop()}>
  <span>${(d) => d.text}</span>
</define>`;

X.html`<define color-label=${ColorLabel}>
  <color-label color="red" text="hello world"></color-label>
</define>`;
```

A component can be rendered directly by [X.html](x-html).

```js
const App = component`<define count=${state(0)}></define>`;

html(App);
```

<a name="x-component" href="x-component">#</a> _X_.**component**(_markup_, _...interpolations_)

Returns a component.

<a name="x-prop" href="x-prop">#</a> _X_.**prop**(_[defaultValue]_)

Returns a prop.

## Composable

Some reusable logic can be defined using [X.composable](x-composable) and accessed through the specified _namespace_.

```js
const useMouse = X.composable`<define 
  x=${X.state(0)} 
  y=${X.state(0)}
  log=${X.method((d) => console.log(d.x, d.y))} 
  ${X.effect((d) => {
    const update = ({clientY, clientX}) => ((d.x = clientX), (d.y = clientY));
    window.addEventListener("mousemove", update);
    return () => (window.removeEventListener("mousemove", update), console.log("remove"));
  })}>
</define>`;

X.html`<define mouse=${useMouse}>
  <button @click=${(d) => d.mouse.log()}>Log</button>
  <span>${(d) => `(${d.mouse.x}, ${d.mouse.y})`}</span>
</define>`;
```

<a name="x-composable" href="x-composable">#</a> _X_.**composable**(_strings_, _...interpolations_)

Returns a reusable composable.

## Store

A global and single-instance store can be defined using [X.store](x-store) and accessed through the specified _namespace_.

```js
// store.js
export createStore = store`<define
  value=${state(0)}
  increment=${method((d) => d.value++)}
  decrement=${method((d) => d.value--)}>
</define>`;
```

```js
// counter.js
import {createStore} from "./store.js";

X.component`<define counter=${createStore()}>
  <button @click=${(d) => d.counter.count++}>👍</button>
  <button @click=${(d) => d.counter.count--}>👎</button>
  <span>${(d) => d.counter.count}</span>
</define>`;
```

<a name="x-store" href="x-store">#</a> _X_.**store**(_strings_, _...interpolations_)

Returns a global and single-instance store.
