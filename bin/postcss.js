#!/usr/bin/env node

"use strict";

var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");
var postcss = require("postcss")([
  require("css-mqpacker")({
    sort: true
  }),
  require("csswring")()
]);

var cssExt = ".css";
var minExt = ".min";
var tmpdir = "../tmp/";

tmpdir = path.resolve(__dirname, tmpdir);
fs.readdirSync(tmpdir).forEach(function (input) {
  var basename = path.basename(input, cssExt);
  var output;

  if (path.extname(input) !== cssExt || path.extname(basename) === minExt) {
    return;
  }

  input = path.join(tmpdir, input);
  output = path.join(tmpdir, basename + minExt + cssExt);
  postcss.process(fs.readFileSync(input, "utf8")).then(function (result) {
    mkdirp.sync(path.dirname(output));
    fs.writeFileSync(output, result.css);
  });
});
