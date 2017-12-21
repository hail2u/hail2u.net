const { execFileSync } = require("child_process");
const fs = require("fs-extra");
const imageSize = require("image-size");
const marked = require("marked");
const path = require("path");
const which = require("which");

const escape = text =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/&lt;(\/)?mark&gt;/g, "<$1mark>");
const pre = (code, lang, escaped) => {
  if (!escaped) {
    code = escape(code);
  }

  if (!lang) {
    return `<pre>${code}
</pre>
`;
  }

  return `<pre><code class="language-${escape(lang)}">${code}
</code></pre>
`;
};
const hn = (content, level) => `<h${level}>${content}</h${level}>
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
const unescape = html =>
  html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
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
    fs.copySync(path.resolve("../src/img/", path.relative("/img/", src)), tmp);
  } else {
    execFileSync(which.sync("curl"), ["-L", "--output", tmp, "-s", src]);
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
const p = content => {
  if (/^(<img\s[^>]*|<a\s.*<\/a)>$/.exec(content)) {
    return `${content}
`;
  }

  return `<p>${content}</p>
`;
};

options.renderer = Object.assign(new marked.Renderer(), {
  code: pre,
  heading: hn,
  html: html,
  image: img,
  paragraph: p
});

module.exports = t => formatHTML(marked(t, options));
