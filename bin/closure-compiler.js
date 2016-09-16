#!/usr/bin/env node

"use strict";

var eachLimit = require("async").eachLimit;
var fs = require("fs");
var compile = require("google-closure-compiler-js").compile;
var mkdirp = require("mkdirp");
var os = require("os");
var path = require("path");

var cpuNum = Math.max(1, os.cpus().length - 1);
var jsExt = ".js";
var minExt = ".min";
var tmpdir = "../tmp/";

tmpdir = path.resolve(__dirname, tmpdir);
eachLimit(fs.readdirSync(tmpdir), cpuNum, function (src, next) {
  var basename = path.basename(src, jsExt);
  var dest;

  if (path.extname(src) !== jsExt || path.extname(basename) === minExt) {
    return next();
  }

  src = path.join(tmpdir, src);
  dest = path.join(tmpdir, basename + minExt + jsExt);
  mkdirp.sync(path.dirname(dest));
  fs.writeFileSync(dest, compile({
    jsCode: [{
      src: fs.readFileSync(src, "utf8")
    }]
  }).compiledCode);
  next();
}, function (err) {
  if (err) {
    throw err;
  }
});
