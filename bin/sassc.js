#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");
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
fs.readdirSync(srcDir).forEach(function (input) {
  var basename = path.basename(input, scssExt);

  if (path.extname(input) !== scssExt || basename.startsWith("_")) {
    return;
  }

  execFile(which("sassc"), argv.concat([
    sl(path.join(srcDir, input)),
  ]), function (err, stdout) {
    if (err) {
      throw err;
    }

    fs.outputFileSync(path.join(destDir, basename + cssExt), stdout);
  });
});
