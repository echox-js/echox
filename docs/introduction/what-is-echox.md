# What is EchoX?

**EchoX** is The 2kB lightweight reactive UI framework for declarative DOM manipulation, alternative to React, Vue and jQuery for small projects especially.

The philosophy for EchoX is **UI = f(reactive, DOM)**, please keep reading to find out why! Also, EchoX focus on simplicity, so there are only [7 APIs](/introduction/api-index) for now!

## Building UI

EchoX provides a declarative way to building user interfaces with pure function calls. A _html_ proxy object exported to **create native DOM directly**. For example, to create a hello world message:

```js
// The dom variable is a native DOM, not a virtual dom!!!
const dom = html.span({style: "font-size: 10"}, ["hello World"]);

// So you can directly append dom to the DOM tree!
container.appendChild(dom);
```

This is the _DOM_ the philosophy. Also, You can also can create nested structures using _html_. For example, let's create a counter:

```js
const dom = html.div([
  html.button({style: "background: red"}, ["👍"]),
  html.button({style: "background: red"}, ["👍"]),
  html.span([0]),
]);
```

Please refer to [Building UI](/reference/building-ui) from more information. **But If you only want a static DOM, this is all you need to know how about EchoX**! Otherwise, just keep reading...

## Applying Reactivity

EchoX exports two methods _reactive_ and _observe_ for reactivity. For example, let's make the counter interactive:

```js
const [scope] = EchoX.reactive().let("value", 0).join();

const dom = html.div([
  html.button({onclick: () => scope.value++}, ["👍"]),
  html.button({onclick: () => scope.value++}, ["👍"]),
  html.span([EchoX.$(() => scope.value)]),
]);
```

_EchoX.reactive_ returns a reactive scope, where stores the states you defined. Then you can bind states with the attributes or child nodes of DOMs using _EchoX.observe_. This is the _reactive_ the philosophy.

Please refer to [Applying Reactivity](/reference/applying-reactivity) for more information.

## What's more?

That's all! But maybe server side rendering (SSR) in the future?
