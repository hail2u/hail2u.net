#!/usr/bin/env node

"use strict";

var csswring = require("csswring");
var eachLimit = require("async").eachLimit;
var fs = require("fs");
var mkdirp = require("mkdirp");
var mqpacker = require("css-mqpacker");
var os = require("os");
var path = require("path");
var postcss = require("postcss");
var roundFloat = require("postcss-round-float");

var cpuNum = Math.max(1, os.cpus().length - 1);
var cssExt = ".css";
var minExt = ".min";
var processor = postcss([
  roundFloat(),
  mqpacker({
    sort: true
  }),
  csswring()
]);
var tmpdir = "../tmp/";

tmpdir = path.resolve(__dirname, tmpdir);
eachLimit(fs.readdirSync(tmpdir), cpuNum, function (input, next) {
  var basename = path.basename(input, cssExt);
  var output;

  if (path.extname(input) !== cssExt || path.extname(basename) === minExt) {
    return next();
  }

  input = path.join(tmpdir, input);
  output = path.join(tmpdir, basename + minExt + cssExt);
  processor.process(fs.readFileSync(input, "utf8")).then(function (result) {
    mkdirp.sync(path.dirname(output));
    fs.writeFileSync(output, result.css);
    next();
  });
}, function (err) {
  if (err) {
    throw err;
  }
});
