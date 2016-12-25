#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const fs = require("fs-extra");
const marked = require("marked");
const minimist = require("minimist");
const path = require("path");
const which = require("which").sync;

const argv = minimist(process.argv.slice(2), {
  string: ["file"]
});
const preview = path.resolve(__dirname, "../tmp/__preview.html");
const template = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width" name="viewport">
    <title>プレビュー - ウェブログ - Hail2u.net</title>
    <link href="/styles/main.min.css" rel="stylesheet">
  </head>
  <body>
    <main class="content">
      <article class="section">
        <footer class="section-footer">
          <p><time datetime="1976-07-23">1976/07/23</time></p>
        </footer>
        <%CONTENT%>
      </article>
    </main>
  </body>
</html>`;

let content = fs.readFileSync(argv.file, "utf8");
let renderer;

function html(t) {
  const sectionTags = ["aside", "figure", "section"];
  const tokens = t.trim().match(/^<(\w+)(.*?)>([\s\S]*)<\/\1>/);

  if (!tokens) {
    return t;
  }

  if (sectionTags.indexOf(tokens[1]) === -1) {
    return t;
  }

  return `<${tokens[1]}${tokens[2]}>\n${
    marked(tokens[3].replace(/&gt;/g, ">"), {
      renderer: renderer
    }).trim()
  }\n</${tokens[1]}>\n`;
}

function p(t) {
  const close = "</p>\n";
  const tokens = t.match(/^(.*?)(?:<!-- (#|\.)(.*?) -->)?$/);

  let open = "<p>";
  let type = "class";

  if (/^(<img\s[^>]*|<a\s.*<\/a)>$/.exec(t)) {
    return `${t}\n`;
  }

  if (!tokens) {
    return `${open}${t}${close}`;
  }

  t = tokens[1];

  if (tokens[2] === "#") {
    type = "id";
  }

  if (tokens[3]) {
    open = `<p ${type}="${tokens[3]}">`;
  }

  return `${open}${t}${close}`;
}

if (!content.endsWith(">")) {
  renderer = new marked.Renderer();
  renderer.html = html;
  renderer.paragraph = p;
  content = marked(content, {
    renderer: renderer
  });
}

content = content.replace(/(href|src)="\/images\//g, "$1=\"../src/img/");
fs.outputFileSync(preview, template.replace(/<%CONTENT%>/g, content).replace(/="\//g, "=\"../dist/"));
execFile(which("open"), [preview], function (err) {
  if (err) {
    throw err;
  }
});
