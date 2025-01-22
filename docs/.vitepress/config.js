import {defineConfig} from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "EchoX",
  description: "UI = f(reactive, template)",
  cleanUrls: true,
  head: [["link", {rel: "icon", type: "image/svg+xml", href: "/logo.svg"}]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {text: "Docs", link: "/introduction/what-is-echox"},
      // {text: "Blogs", link: "/blog/index"},
      {
        text: "Examples",
        items: [{text: "SVG", link: "https://observablehq.com/d/975d1bd7e1cb0e2b"}],
      },
    ],
    sidebar: {
      "/": [
        {
          text: "Introduction",
          items: [
            {text: "What is EchoX", link: "/introduction/what-is-echox"},
            {text: "Why is EchoX", link: "/introduction/why-is-echox"},
            {text: "Getting Started", link: "/introduction/getting-started"},
            {text: "API Index", link: "/introduction/api-index"},
          ],
        },
        {
          text: "Reference",
          items: [
            {text: "Building UI", link: "/reference/building-ui"},
            {text: "Applying Reactivity", link: "/reference/applying-reactivity"},
          ],
        },
      ],
      "/blog/": [],
    },
    socialLinks: [{icon: "github", link: "https://github.com/echox-js/echox"}],
    footer: {
      message: "Released under the MIT License.",
      copyright: `Copyright © 2025-${new Date().getUTCFullYear()} Bairui SU`,
    },
    logo: "/logo.svg",
    search: {
      provider: "local",
    },
  },
});
