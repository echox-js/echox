---
sidebar_position: 1
---

# Introduction

## What is EchoX

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
