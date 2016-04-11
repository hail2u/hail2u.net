#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");
var path = require("path");
var postcss = require("postcss")([
  require("css-mqpacker")({
    sort: true
  }),
  require("csswring")()
]);

var ext = ".css";
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
  postcss.process(fs.readFileSync(input, "utf8")).then(function (result) {
    fs.outputFileSync(output, result.css);
  });
});
