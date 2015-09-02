"use strict";

module.exports = function (grunt) {
  grunt.registerTask("preview", "Preview Blosxom file.", function () {
    var fs = require("fs-extra");
    var marked = require("marked");
    var spawn = require("child_process").spawnSync;
    var which = require("which").sync;

    var filePreview = "tmp/__preview.html";
    var preview = function () {/*
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width" name="viewport">
    <title><%TITLE%> - Weblog - Hail2u.net</title>
    <link href="/styles/style.min.css" rel="stylesheet">
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
</html>
    */}.toString().split("\n").slice(1, -1).join("\n");
    var fileEntry = grunt.option("file");
    var entry = fs.readFileSync(fileEntry, "UTF-8").split("\n");
    var title = entry.shift().replace(/\$/g, "$$$$");
    var body = entry.join("\n").replace(/\$/g, "$$$$");
    body = marked(body).replace(/(href|src)="\/images\//g, "$1=\"../src/img/");
    preview = preview.replace(/<%TITLE%>/g, title).replace(/<%BODY%>/g, body).replace(/="\//g, "=\"../build/");
    fs.outputFileSync(filePreview, preview);
    grunt.log.writeln('File "' + filePreview + '" created.');
    spawn(which("open"), [filePreview]);
  });
};
