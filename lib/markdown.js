const { execFileSync } = require("child_process").execFileSync;
const fs = require("fs-extra");
const imageSize = require("image-size");
const marked = require("marked");
const path = require("path");
const which = require("which").sync;

const escape = text =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/&lt;(\/)?mark&gt;/g, "<$1mark>");
const pre = (code, lang) => {
  if (!lang) {
    return `<pre>${escape(code)}
</pre>
`;
  }

  return `<pre><code class="language-${lang}">${escape(code)}
</code></pre>
`;
};
const hn = (content, level) => `<h${level}>${escape(content)}</h${level}>
`;
const sectionTags = ["aside", "figure", "section"];
const formatHTML = html =>
  html
    .trim()
    .replace(
      /\n+(<(aside|blockquote|div|dl|figure|h[1-6]|hr|ol|p|pre|section|table|ul)\b)/g,
      "\n\n$1"
    )
    .replace(/<(aside|figure|section)></g, "<$1>\n<")
    .replace(/<blockquote>\n\n<p/g, "<blockquote>\n<p");
const unescape = text => text.replace(/&gt;/g, ">");
const options = {};
const html = content => {
  const tokens = content.trim().match(/^<(\w+)(.*?)>([\s\S]*)<\/\1>/);

  if (!tokens) {
    return content;
  }

  const tag = tokens[1].toLowerCase();

  if (sectionTags.indexOf(tag) === -1) {
    return content;
  }

  return `<${tag}${tokens[2]}>
${formatHTML(marked(unescape(tokens[3]), options))}
</${tag}>
`;
};
const tmp = "../tmp/__image";
const img = (src, title, alt) => {
  if (src.startsWith("/img/")) {
    fs.copySync(path.resolve("../dist/img/", path.relative("/img/", src)), tmp);
  } else {
    execFileSync(which("curl"), ["-L", "--output", tmp, "-s", src]);
  }

  const size = imageSize(tmp);

  if (title) {
    title = ` title="${title}"`;
  } else {
    title = "";
  }

  return `<img alt="${alt}" height="${
    size.height
  }" src="${src}"${title} width="${size.width}">`;
};

options.renderer = Object.assign(new marked.Renderer(), {
  code: pre,
  heading: hn,
  html: html,
  image: img
});

module.exports = t => formatHTML(marked(t, options));
