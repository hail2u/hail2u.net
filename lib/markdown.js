const { execFileSync } = require("child_process").execFileSync;
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
${marked(unescape(tokens[3]), options).trim()}
</${tag}>
`;
};
const tmp = "../tmp/__image";
const img = (src, title, alt) => {
  let entity = src;

  if (title) {
    title = ` title="${title}"`;
  } else {
    title = "";
  }

  if (entity.startsWith("/img/")) {
    entity = path.resolve("../dist/img/", path.relative("/img/", entity));
  } else {
    execFileSync(which("curl"), ["-L", "--output", tmp, "-s", entity]);
    entity = tmp;
  }

  const dimensions = imageSize(entity);
  const height = ` height="${dimensions.height}"`;
  const width = ` width="${dimensions.width}"`;

  return `<img alt="${alt}"${height} src="${src}"${title}${width}>`;
};

options.renderer = Object.assign(new marked.Renderer(), {
  code: pre,
  heading: hn,
  html: html,
  image: img
});

module.exports = t =>
  marked(t.trim(), options)
    .replace(
      /\n+(<(aside|blockquote|div|dl|figure|h[1-6]|hr|ol|p|pre|section|table|ul)\b)/g,
      "\n\n$1"
    )
    .replace(/<(aside|figure|section)></g, "<$1>\n<")
    .replace(/<blockquote>\n\n<p/g, "<blockquote>\n<p");
