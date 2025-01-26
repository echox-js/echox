# EchoX: UI = f(DOM, reactive)

<img src="./docs/public/logo.svg" width="100"/>

The lightweight reactive UI framework for declarative DOM manipulation, alternative to React, Vue and jQuery for small projects.

```js
import {html, reactive, $} from "echox";

const scope = reactive().let("value", 0).join();

const counter = html.div([
  html.button({onclick: () => scope.value++}, ["👍"]),
  html.button({onclick: () => scope.value++}, ["👍"]),
  html.span([$(() => scope.value)]),
]);

document.body.appendChild(counter);
```

## Resources 📚

- Documentation - https://echox.dev/
- Features - https://echox.dev/introduction/what-is-echox
- Motivation - https://echox.dev/introduction/why-is-echox

## License 📄

MIT@Bairui SU
