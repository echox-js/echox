import {defineConfig} from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "EchoX",
  description: "UI = f(reactive, template)",
  cleanUrls: true,
  head: [["link", {rel: "icon", type: "image/png", href: "/logo.png"}]],
  appearance: false,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {text: "Docs", link: "/what-is-echox"},
      // {text: "Blogs", link: "/blog/index"},
    ],
    sidebar: {
      "/": [
        {
          text: "Introduction",
          items: [
            {text: "What is EchoX", link: "/what-is-echox"},
            {text: "Why is EchoX", link: "/why-is-echox"},
            {text: "Getting Started", link: "/getting-started"},
            {text: "API Index", link: "/api-index"},
          ],
        },
        {
          text: "Reference",
          items: [
            {text: "EchoX DOM", link: "/echox-dom"},
            {text: "EchoX Reactive", link: "/echox-reactive"},
          ],
        },
      ],
      "/blog/": [],
    },
    socialLinks: [{icon: "github", link: "https://github.com/blinkblinkhq/echox"}],
    footer: {
      message: "Released under the MIT License.",
      copyright: `Copyright © 2025-${new Date().getUTCFullYear()} Bairui SU`,
    },
    logo: "/logo.png",
    search: {
      provider: "local",
    },
  },
});
