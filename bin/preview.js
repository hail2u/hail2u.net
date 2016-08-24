#!/usr/bin/env node

"use strict";

var fs = require("fs");
var marked = require("marked");
var minimist = require("minimist");
var mkdirp = require("mkdirp");
var path = require("path");
var spawn = require("child_process").spawnSync;
var which = require("which").sync;

var argv = minimist(process.argv.slice(2), {
  string: ["file"]
});
var article = fs.readFileSync(argv.file, "utf8").split("\n");
var body;
var preview = "../tmp/__preview.html";
var renderer;
var template = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width" name="viewport">
    <title><%TITLE%> - Weblog - Hail2u.net</title>
    <link href="/styles/main.min.css" rel="stylesheet">
  </head>
  <body style="margin-bottom: 6rem">
    <main class="content">
      <article class="section" role="main">
        <footer class="section-footer">
          <p>on <time datetime="1976-07-23">Jul 23, 1976</time> under <span class="tag"><a href="#">Preview</a></span></p>
        </footer>
        <h1 class="first-heading"><%TITLE%></h1>
        <%BODY%>
      </article>
    </main>
  </body>
</html>`;
var title;

function html(t) {
  var sectionTags = ["aside", "figure", "section"];
  var tag;
  var tokens = t.trim().match(/^<(\w+)(.*?)>([\s\S]*)<\/\1>/);

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
  var close = "</p>\n";
  var open = "<p>";
  var tokens = t.match(/^(.*?)(?:<!-- (#|\.)(.*?) -->)?$/);
  var type = "class";

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

if (!body.startsWith("<")) {
  renderer = new marked.Renderer();
  renderer.html = html;
  renderer.paragraph = p;
  body = marked({
    renderer: renderer
  });
}

body = body.replace(/(href|src)="\/images\//g, "$1=\"../src/img/");
preview = path.resolve(__dirname, preview);
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
spawn(which("open"), [preview]);
