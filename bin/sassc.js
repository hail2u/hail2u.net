#!/usr/bin/env node

"use strict";

var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");
var execFile = require("child_process").execFile;
var which = require("which").sync;

var argv = process.argv.slice(2);
var cssExt = ".css";
var destDir = "../tmp/";
var scssExt = ".scss";
var srcDir = "../src/css/";

function sl(p) {
  return p.replace(/\\/g, "/");
}

destDir = path.resolve(__dirname, destDir);
srcDir = path.resolve(__dirname, srcDir);
fs.readdirSync(srcDir).forEach(function (src) {
  var basename = path.basename(src, scssExt);

  if (path.extname(src) !== scssExt || basename.startsWith("_")) {
    return;
  }

  execFile(which("sassc"), argv.concat([
    sl(path.join(srcDir, src))
  ]), function (err, stdout) {
    var dest;

    if (err) {
      throw err;
    }

    dest = path.join(destDir, basename + cssExt);
    mkdirp.sync(path.dirname(dest));
    fs.writeFileSync(dest, stdout);
  });
});
