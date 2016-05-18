#!/usr/bin/env node

"use strict";

var eachLimit = require("async").eachLimit;
var fs = require("fs");
var minifyJS = require("uglify-js").minify;
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
  fs.writeFileSync(dest, minifyJS(src, {
    output: {
      comments: /^!/
    }
  }).code);
  next();
}, function (err) {
  if (err) {
    throw err;
  }
});
