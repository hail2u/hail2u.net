#!/usr/bin/env node

"use strict";

const marked = require("marked");

const renderer = new marked.Renderer();

function escape(s) {
  return s.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function unescape(s) {
  return s.replace(
    /&gt;/g,
    ">"
  );
}

function hn(text, level) {
  return `<h${level}>${text}</h${level}>
`;
}

function hr() {
  return this.options.xhtml ? "<hr/>\n" : "<hr>\n";
}

function html(ht) {
  const sectionTags = ["aside", "figure", "section"];
  const tokens = ht.trim().match(/^<(\w+)(.*?)>([\s\S]*)<\/\1>/);

  if (!tokens) {
    return ht;
  }

  const tag = tokens[1].toLowerCase();

  if (sectionTags.indexOf(tag) === -1) {
    return ht;
  }

  return `<${tag}${tokens[2]}>
${marked(unescape(tokens[3]), {
  renderer: renderer
}).trim()}
</${tag}>
`;
}

function img(href, title, text) {
  let out = `<img alt="${text}" src="${href}"`;

  if (title) {
    out += ` title="${title}"`;
  }

  return `${out}${(this.options.xhtml ? "/>" : ">")}`;
}

function p(text) {
  const close = "</p>\n";
  const tokens = text.match(/^(.*?)(?:<!-- (#|\.)(.*?) -->)?$/);
  let open = "<p>";
  let type = "class";

  if (/^(<img\s[^>]*|<a\s.*<\/a)>$/.exec(text)) {
    return `${text}
`;
  }

  if (!tokens) {
    return open + text + close;
  }

  text = tokens[1];

  if (tokens[2] === "#") {
    type = "id";
  }

  if (tokens[3]) {
    open = `<p ${type}="${tokens[3]}">`;
  }

  return open + text + close;
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
renderer.hr = hr;
renderer.html = html;
renderer.image = img;
renderer.paragraph = p;

module.exports = function (s) {
  return marked(s.trim(), {
    renderer: renderer
  }).replace(/\n+(<(aside|blockquote|div|dl|figure|h[1-6]|hr|ol|p|pre|section|table|ul)\b)/g, "\n\n$1")
    .replace(/<(aside|figure|section)></g, "<$1>\n<")
    .replace(/<blockquote>\n\n<p/g, "<blockquote>\n<p");
};
