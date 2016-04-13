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
<html class="permalink" lang="ja">
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
        <h1 class="first-heading"><%TITLE%></h1>
        <footer class="section-footer">
          <p>on <time datetime="1976-07-23">Jul 23, 1976</time> under <span class="tag"><a href="#">Preview</a></span></p>
        </footer>
        <%BODY%>
      </article>
    </main>
  </body>
</html>`;

previewFile = path.resolve(__dirname, previewFile);
fs.outputFileSync(
  previewFile,
  previewTemplate.replace(
    /<%TITLE%>/g,
    article.shift().replace(/\$/g, "$$$$")
  ).replace(
    /<%BODY%>/g,
    marked(
      article.join("\n").replace(/\$/g, "$$$$")
    ).replace(/(href|src)="\/images\//g, "$1=\"../src/img/")
  ).replace(
    /="\//g,
    "=\"../dist/"
  )
);
spawn(which("open"), [previewFile]);
