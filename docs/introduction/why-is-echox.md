# Why is EchoX?

"Big" tools such as [React](https://react.dev/) and [Vue](https://vuejs.org/) are too much, especially for small projects. Too much abstractions result in too much APIs to learn, too much to be caution about and too much to optimize.

Low-level APIs such as [jQuery](https://jquery.com/) or [Native DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) are not smart enough, involving syncing data and views manually. Also, they are not declarative enough in terms of building UI which means less maintainable and readable.

Some small tools try to reduce the burden, such as [Preact](https://preactjs.com/), [Petite Vue](https://github.com/vuejs/petite-vue) and [Alpine](https://alpinejs.dev/). But still not convenient enough, they can not even satisfied with the three basic needs for small projects at the small time!

- Readable template
- Fully TypeScript support
- No compiling or transpling

[VanJS](https://vanjs.org/) is great in terms of above considerations. In fact, EchoX draws a lot of inspirations from it! But the APIs it provided are too low-level, so they are not as ergonomic as the tools mentioned above, though its extension [VanX](https://vanjs.org/x) making the developer experience better.

Now introduces EchoX, which is lightweight, portable, ergonomic and high-performance!

## Pure Functional UI Construction

Build user interfaces with pure function calls, without compilation like JSX, and with full TypeScript support over string-based templates, portable and readable.

## Granular State Observation

Apply fine-grained state observation, allowing independently update, minimizing unnecessary DOM updates and improves performance compared to virtual DOM-based frameworks.

## Lightweight Native DOM Manipulation

Operates directly on the native DOM instead of relying on a virtual DOM, achieving higher performance and lower memory overhead while maintaining simplicity.
