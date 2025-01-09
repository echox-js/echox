---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "UI = f(reactive, DOM)"
  text: The 2kB lightweight reactive UI framework for declarative DOM manipulation
  tagline: Alternative to React, Vue and jQuery for small projects especially
  image:
    src: /logo.svg
    alt: logo
  actions:
    - theme: brand
      text: Get Started
      link: /introduction/getting-started
    - theme: alt
      text: What is EchoX?
      link: /introduction/what-is-echox

features:
  - title: Pure Functional UI Construction
    details: Build user interfaces with pure function calls, without compilation like JSX, and with full TypeScript support over string-based templates, portable and readable.
  - title: Granular State Observation
    details: Apply fine-grained state observation, allowing independently update, minimizing unnecessary DOM updates and improves performance compared to virtual DOM-based frameworks.
  - title: Lightweight Native DOM Manipulation
    details: Operates directly on the native DOM instead of relying on a virtual DOM, achieving higher performance and lower memory overhead while maintaining simplicity.
---
