"use strict";

const child_process = require("child_process");
const imageSize = require("image-size");
const marked = require("marked");
const path = require("path");
const which = require("which").sync;

const tmp = "../tmp/__image";
const options = {};

function escape(text) {
  return text.replace(/<(\/?)mark>/g, "`$1mark`")
    .replace(/&amp;/g, "&")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/`(\/)?mark`/g, "<$1mark>");
}

function unescape(text) {
  return text.replace(/&gt;/g, ">");
}

function hn(content, level) {
  return `<h${level}>${escape(content)}</h${level}>
`;
}

function html(content) {
  const sectionTags = ["aside", "figure", "section"];
  const tokens = content.trim()
    .match(/^<(\w+)(.*?)>([\s\S]*)<\/\1>/);

  if (!tokens) {
    return content;
  }

  const tag = tokens[1].toLowerCase();

  if (sectionTags.indexOf(tag) === -1) {
    return content;
  }

  return `<${tag}${tokens[2]}>
${
  marked(unescape(tokens[3]), options)
    .trim()
}
</${tag}>
`;
}

function img(src, title, alt) {
  let entity = src;

  if (title) {
    title = ` title="${title}"`;
  } else {
    title = "";
  }

  if (entity.startsWith("/img/")) {
    entity = path.resolve("../dist/img/", path.relative("/img/", entity));
  } else {
    child_process.execFileSync(which("curl"), [
      "-L",
      "--output",
      tmp,
      "-s",
      entity
    ]);
    entity = tmp;
  }

  const dimensions = imageSize(entity);
  const height = ` height="${dimensions.height}"`;
  const width = ` width="${dimensions.width}"`;

  return `<img alt="${alt}"${height} src="${src}"${title}${width}>`;
}

function p(content) {
  const close = "</p>";
  const tokens = content.match(/^(.*?)(?:<!-- (#|\.)(.*?) -->)?$/);
  let open = "<p";
  let type = "class";

  if (/^(<img\s[^>]*|<a\s.*<\/a)>$/.exec(content)) {
    return `${content}
`;
  }

  if (!tokens) {
    return `${open}>${content}${close}
`;
  }

  content = tokens[1];

  if (tokens[2] === "#") {
    type = "id";
  }

  if (tokens[3]) {
    open = `${open} ${type}="${tokens[3]}"`;
  }

  return `${open}>${content}${close}
`;
}

function pre(code, lang) {
  if (!lang) {
    return `<pre>${escape(code)}
</pre>
`;
  }

  return `<pre><code class="language-${lang}">${escape(code)}
</code></pre>
`;
}

const renderer = new marked.Renderer();

renderer.code = pre;
renderer.heading = hn;
renderer.html = html;
renderer.image = img;
renderer.paragraph = p;
options.renderer = renderer;

module.exports = (t) => {
  return marked(t.trim(), options)
    .replace(/\n+(<(aside|blockquote|div|dl|figure|h[1-6]|hr|ol|p|pre|section|table|ul)\b)/g, "\n\n$1")
    .replace(/<(aside|figure|section)></g, "<$1>\n<")
    .replace(/<blockquote>\n\n<p/g, "<blockquote>\n<p");
};
