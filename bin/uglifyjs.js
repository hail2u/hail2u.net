#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");
var minifyJS = require("uglify-js").minify;
var path = require("path");

var ext = ".js";
var min = ".min";
var tmpdir = "tmp/";

fs.readdirSync(tmpdir).forEach(function (input) {
  var basename = path.basename(input, ext);
  var output;

  if (path.extname(input) !== ext || path.extname(basename) === min) {
    return;
  }

  input = path.join(tmpdir, input);
  output = path.join(tmpdir, basename + min + ext);
  fs.outputFileSync(output, minifyJS(input, {
    output: {
      comments: /@preserve|@license|@cc_on/i
    }
  }).code);
});
