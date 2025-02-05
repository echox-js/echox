# What is EchoX?

**EchoX** is The lightweight reactive UI framework for declarative DOM manipulation, alternative to React, Vue and jQuery for small projects especially.

The philosophy for EchoX is **UI = f(DOM, Reactive)**, please keep reading to find out why! Also, EchoX focus on simplicity, so there are only few [APIs](/api-index) for now!

## Building UI

EchoX provides a declarative way to building user interfaces with pure function calls. A _html_ proxy object exported to **create native DOM directly**. For example, to create a hello world message:

```js
// The dom variable is a native DOM, not a virtual dom!!!
const dom = html.span({style: "font-size: 10"}, ["hello World"]);

// So you can directly append dom to the DOM tree!
container.appendChild(dom);
```

This is the _DOM_ in the philosophy. Also, You can also can create nested structures using _html_. For example, let's create a counter:

```js
const dom = html.div([
  html.button({style: "background: red"}, ["👍"]),
  html.button({style: "background: red"}, ["👎"]),
  html.span([0]),
]);
```

Please refer to [EchoX DOM](/echox-dom) from more information.

**If you only want a static DOM, this is all you need to know how about EchoX**! Otherwise, keep reading!

## Applying Reactivity

EchoX exports one method _reactive_ for reactivity. For example, let's make the counter interactive:

```js
const state = ex
  .reactive()
  .state("value", 0)
  .computed("double", (d) => d.value * 2)
  .effect((d) => console.log(d.value, d.double))
  .join();

const dom = html.div([
  html.button({onclick: () => scope.value++}, ["👍"]),
  html.button({onclick: () => scope.value--}, ["👎"]),
  html.span([state.select("double")]),
]);
```

_EchoX.reactive_ returns a reactive scope, where stores the states you defined. Then you can bind states with the attributes or child nodes of DOMs using _use_. This is the _reactive_ in the philosophy.

Please refer to [EchoX Reactive](/echox-reactive) for more information.

## What's more?

That's all! But maybe server side rendering (SSR) in the future?
