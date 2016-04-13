#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");
var minifyJS = require("uglify-js").minify;
var path = require("path");

var jsExt = ".js";
var minExt = ".min";
var tmpdir = "../tmp/";

tmpdir = path.resolve(__dirname, tmpdir);
fs.readdirSync(tmpdir).forEach(function (input) {
  var basename = path.basename(input, jsExt);
  var output;

  if (path.extname(input) !== jsExt || path.extname(basename) === minExt) {
    return;
  }

  input = path.join(tmpdir, input);
  output = path.join(tmpdir, basename + minExt + jsExt);
  fs.outputFileSync(output, minifyJS(input, {
    output: {
      comments: /@preserve|@license|@cc_on/i
    }
  }).code);
});
