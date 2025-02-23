---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "UI = f(DOM, Reactive)"
  text: The lightweight reactive UI framework for declarative DOM manipulation
  tagline: Alternative to React, Vue and jQuery for small projects especially
  image:
    src: /logo.svg
    alt: logo
  actions:
    - theme: brand
      text: Get Started
      link: /docs/getting-started
    - theme: alt
      text: What is EchoX?
      link: /docs/what-is-echox

features:
  - title: Pure Functional UI Construction
    details: Build UI with pure function calls, no compilation like JSX, and full TypeScript support over string-based templates, enhancing portability and readability,
  - title: Granular State Observation
    details: Apply fine-grained state observation, allowing independently update, minimizing unnecessary DOM updates and improving performance compared to virtual DOM-based frameworks.
  - title: Lightweight Native DOM Manipulation
    details: Operate directly on the native DOM instead of relying on a virtual DOM, achieving higher performance and lower memory overhead while maintaining simplicity.
---
