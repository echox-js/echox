---
sidebar_position: 2
---

# Getting Started

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
