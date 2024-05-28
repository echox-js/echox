# EcoJS

> WIP

The fast, reactive UI framework with a size of 3 KB.

- Fast - no virtual DOM
- Small - 3KB (gzip)
- Simple - similar to HTML

```js
import * as eco from "ecojs";

const node = eco.html`<define count=${eco.state(0)}>
  <button @click=${(d) => d.count++}>👍</button>
  <button @click=${(d) => d.count--}>👎</button>
  <span>${(d) => d.count}</span>
</define>`;

document.body.append(node);
```
