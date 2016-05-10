#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");
var marked = require("marked");
var minimist = require("minimist");
var path = require("path");
var spawn = require("child_process").spawnSync;
var which = require("which").sync;

var argv = minimist(process.argv.slice(2), {
  string: ["file"]
});
var article = fs.readFileSync(
  argv.file,
  "utf8"
).split("\n");
var previewFile = "../tmp/__preview.html";
var previewTemplate = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width" name="viewport">
    <title><%TITLE%> - Weblog - Hail2u.net</title>
    <link href="/styles/common.min.css" rel="stylesheet">
    <link href="/styles/permalink.min.css" rel="stylesheet">
  </head>
  <body style="margin-bottom: 6rem">
    <main class="content">
      <article role="main">
        <footer class="section-footer">
          <p>on <time datetime="1976-07-23">Jul 23, 1976</time> under <span class="tag"><a href="#">Preview</a></span></p>
        </footer>
        <h1 class="first-heading"><%TITLE%></h1>
        <%BODY%>
      </article>
    </main>
  </body>
</html>`;
var renderer = new marked.Renderer();

function h(html) {
  var attributes;
  var contents;
  var tag;
  var tags = ["aside", "figure", "section"];
  var tokens = html.trim().match(/^<(\w+)(.*?)>([\s\S]*)<\/\1>/);

  if (!tokens) {
    return html;
  }

  tag = tokens[1];

  if (tags.indexOf(tag) === -1) {
    return html;
  }

  attributes = tokens[2];
  contents = marked(tokens[3].replace(/&gt;/g, ">"), {
    renderer: renderer
  }).trim();

  return "<" + tag + attributes + ">\n" + contents + "\n</" + tag + ">\n";
}

function p(text) {
  var close = "</p>\n";
  var open = "<p>";
  var tokens = text.match(/^(.*?)(?:<!-- (#|\.)(.*?) -->)?$/);
  var type = "class";

  if (/^<img\s.*>$/.exec(text)) {
    return text + "\n";
  }

  if (!tokens) {
    return open + text + close;
  }

  text = tokens[1];

  if (tokens[2] === "#") {
    type = "id";
  }

  if (tokens[3]) {
    open = "<p " + type + '="' + tokens[3] + '">';
  }

  return open + text + close;
}

renderer.html = h;
renderer.paragraph = p;
previewFile = path.resolve(__dirname, previewFile);
fs.outputFileSync(
  previewFile,
  previewTemplate.replace(
    /<%TITLE%>/g,
    article.shift().replace(/\$/g, "$$$$")
  ).replace(
    /<%BODY%>/g,
    marked(
      article.join("\n").replace(/\$/g, "$$$$"),
      {
        renderer: renderer
      }
    ).replace(/(href|src)="\/images\//g, "$1=\"../src/img/")
  ).replace(
    /="\//g,
    "=\"../dist/"
  )
);
spawn(which("open"), [previewFile]);
