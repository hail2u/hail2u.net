#!/usr/bin/env node

"use strict";

var async = require("async");
var fs = require("fs");
var mkdirp = require("mkdirp");
var os = require("os");
var path = require("path");
var postcss = require("postcss")([
  require("css-mqpacker")({
    sort: true
  }),
  require("csswring")()
]);

var cpuNum = Math.max(1, os.cpus().length - 1);
var cssExt = ".css";
var minExt = ".min";
var tmpdir = "../tmp/";

tmpdir = path.resolve(__dirname, tmpdir);
async.eachLimit(fs.readdirSync(tmpdir), cpuNum, function (input, next) {
  var basename = path.basename(input, cssExt);
  var output;

  if (path.extname(input) !== cssExt || path.extname(basename) === minExt) {
    return next();
  }

  input = path.join(tmpdir, input);
  output = path.join(tmpdir, basename + minExt + cssExt);
  postcss.process(fs.readFileSync(input, "utf8")).then(function (result) {
    mkdirp.sync(path.dirname(output));
    fs.writeFileSync(output, result.css);
    next();
  });
}, function (err) {
  if (err) {
    throw err;
  }
});
