#!/usr/bin/env node

"use strict";

var fs = require("fs");
var path = require("path");
var spawn = require("child_process").spawnSync;
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
  var sassc;

  if (path.extname(input) !== scssExt || basename.startsWith("_")) {
    return;
  }

  sassc = spawn(which("sassc"), argv.concat([
    sl(path.join(srcDir, input)),
    sl(path.join(destDir, basename + cssExt))
  ]), {
    stdio: "inherit"
  });

  if (sassc.error) {
    throw sassc.error;
  }
});
