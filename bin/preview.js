#!/usr/bin/env node

"use strict";

const fs = require("fs");
const marked = require("marked");
const minimist = require("minimist");
const mkdirp = require("mkdirp");
const path = require("path");
const spawn = require("child_process").spawnSync;

const argv = minimist(process.argv.slice(2), {
  string: ["file"]
});
const article = fs.readFileSync(argv.file, "utf8").split("\n");
const preview = path.resolve(__dirname, "../tmp/__preview.html");
const template = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width" name="viewport">
    <title><%TITLE%> - Weblog - Hail2u.net</title>
    <link href="/styles/main.min.css" rel="stylesheet">
  </head>
  <body>
    <main class="content">
      <article class="section">
        <footer class="section-footer">
          <p><time datetime="1976-07-23">1976/07/23</time></p>
        </footer>
        <h1 class="first-heading"><%TITLE%></h1>
        <%BODY%>
      </article>
    </main>
  </body>
</html>`;

let body;
let renderer;
let title;

function html(t) {
  const sectionTags = ["aside", "figure", "section"];
  const tokens = t.trim().match(/^<(\w+)(.*?)>([\s\S]*)<\/\1>/);

  let tag;

  if (!tokens) {
    return t;
  }

  tag = tokens[1].toLowerCase();

  if (sectionTags.indexOf(tag) === -1) {
    return t;
  }

  return "<" + tag + tokens[2] + ">\n" +
    marked(tokens[3].replace(/&gt;/g, ">"), {
      renderer: renderer
    }).trim() + "\n</" + tag + ">\n";
}

function p(t) {
  const close = "</p>\n";
  const tokens = t.match(/^(.*?)(?:<!-- (#|\.)(.*?) -->)?$/);

  let open = "<p>";
  let type = "class";

  if (/^(<img\s[^>]*|<a\s.*<\/a)>$/.exec(t)) {
    return t + "\n";
  }

  if (!tokens) {
    return open + t + close;
  }

  t = tokens[1];

  if (tokens[2] === "#") {
    type = "id";
  }

  if (tokens[3]) {
    open = "<p " + type + '="' + tokens[3] + '">';
  }

  return open + t + close;
}

title = article.shift().trim().replace(/\$/g, "$$$$");
body = article.join("\n").trim().replace(/\$/g, "$$$$");

if (!body.endsWith(">")) {
  renderer = new marked.Renderer();
  renderer.html = html;
  renderer.paragraph = p;
  body = marked(body, {
    renderer: renderer
  });
}

body = body.replace(/(href|src)="\/images\//g, "$1=\"../src/img/");
mkdirp.sync(path.dirname(preview));
fs.writeFileSync(
  preview,
  template.replace(
    /<%TITLE%>/g,
    title
  ).replace(
    /<%BODY%>/g,
    body
  ).replace(
    /="\//g,
    "=\"../dist/"
  )
);
spawn("open", [preview]);
