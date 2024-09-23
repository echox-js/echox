---
sidebar_position: 1
---

# Introduction

The fast, 3KB JavaScript framework for "echoing" reactive UI in functional style.

## What is EchoX

A quick example of EchoX:

```js eval t=echox
EchoX.component(
  EchoX.reactive()
    .let("value", 0)
    .let("increment", (d) => () => d.value++)
    .let("decrement", (d) => () => d.value--),
  html.div()(
    html.button({onclick: (d) => d.increment})("👍"),
    html.button({onclick: (d) => d.decrement})("👎"),
    html.span()((d) => d.value),
  ),
)
```

## Why EchoX

- **Fast** - No Compiling, but Fine-tune Reactivity and No Virtual DOM Diff
- **Small** - Zero Dependencies, 3KB (gzip)
- **Simple** - 16 APIs, 1 Hour Learning
- **Productive** - Structural Code, but Nicely Reusable Logic and Flexible Organization of Concerns
- **Pragmatic** - No Transpiling, but Readable Template and Fully TS Support
