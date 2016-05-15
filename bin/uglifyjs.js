#!/usr/bin/env node

"use strict";

var fs = require("fs");
var minifyJS = require("uglify-js").minify;
var mkdirp = require("mkdirp");
var path = require("path");

var jsExt = ".js";
var minExt = ".min";
var tmpdir = "../tmp/";

tmpdir = path.resolve(__dirname, tmpdir);
fs.readdirSync(tmpdir).forEach(function (src) {
  var basename = path.basename(src, jsExt);
  var dest;

  if (path.extname(src) !== jsExt || path.extname(basename) === minExt) {
    return;
  }

  src = path.join(tmpdir, src);
  dest = path.join(tmpdir, basename + minExt + jsExt);
  mkdirp.sync(path.dirname(dest));
  fs.writeFileSync(dest, minifyJS(src, {
    output: {
      comments: /@preserve|@license|@cc_on/i
    }
  }).code);
});
