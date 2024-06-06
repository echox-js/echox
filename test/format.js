import beautify from "js-beautify";

export function format(html) {
  return beautify
    .html(html, {
      indent_size: 0,
      inline: ["title", "tspan", "span", "svg", "a", "i"],
      indent_inner_html: false,
    })
    .replace(/\n/g, "");
}
