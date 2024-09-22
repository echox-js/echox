---
sidebar_position: 1
---

# Introduction

```js eval code=false
size = Inputs.range([50, 300], { label: "size", value: 100, step: 1 });
```

```js eval
(() => {
  const div = document.createElement("div");
  div.style.width = size + "px";
  div.style.height = "100px";
  div.style.background = "orange";
  return div;
})();
```

## What is EchoX

## Why EchoX
