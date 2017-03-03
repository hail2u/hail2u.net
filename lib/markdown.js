"use strict";

const marked = require("marked");

const renderer = new marked.Renderer();

function escape(text) {
  return text.replace(/&amp;/g, "&")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function unescape(text) {
  return text.replace(/&gt;/g, ">");
}

function hn(content, level) {
  return `<h${level}>${content}</h${level}>
`;
}

function html(content) {
  const sectionTags = ["aside", "figure", "section"];
  const tokens = content.trim().match(/^<(\w+)(.*?)>([\s\S]*)<\/\1>/);

  if (!tokens) {
    return content;
  }

  const tag = tokens[1].toLowerCase();

  if (sectionTags.indexOf(tag) === -1) {
    return content;
  }

  return `<${tag}${tokens[2]}>
${marked(unescape(tokens[3]), {
  renderer: renderer
}).trim()}
</${tag}>
`;
}

function img(src, title, alt) {
  if (title) {
    title = ` title="${title}"`;
  }

  return `<img alt="${alt}" src="${src}"${title}>`;
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

renderer.code = pre;
renderer.heading = hn;
renderer.html = html;
renderer.image = img;
renderer.paragraph = p;

module.exports = (t) => {
  return marked(t.trim(), {
    renderer: renderer
  }).replace(/\n+(<(aside|blockquote|div|dl|figure|h[1-6]|hr|ol|p|pre|section|table|ul)\b)/g, "\n\n$1")
    .replace(/<(aside|figure|section)></g, "<$1>\n<")
    .replace(/<blockquote>\n\n<p/g, "<blockquote>\n<p");
};
