# EchoX: UI = f(reactive, DOM)

<img src="./docs/public/logo.svg" width="100"/>

The lightweight reactive UI framework for declarative DOM manipulation, alternative to React, Vue and jQuery for small projects.

```js
import {html, reactive, $} from "echox";

const [scope] = reactive().let("value", 0).join();

const counter = html.div([
  html.button({onclick: () => scope.value++}, ["👍"]),
  html.button({onclick: () => scope.value++}, ["👍"]),
  html.span([$(() => scope.value)]),
]);

document.body.appendChild(counter);
```

## Pure Functional UI Construction

Build user interfaces with pure function calls, without compilation like JSX, and with full TypeScript support over string-based templates, portable and readable.

## Granular State Observation

Apply fine-grained state observation, allowing independently update, minimizing unnecessary DOM updates and improves performance compared to virtual DOM-based frameworks.

## Lightweight Native DOM Manipulation

Operates directly on the native DOM instead of relying on a virtual DOM, achieving higher performance and lower memory overhead while maintaining simplicity.
