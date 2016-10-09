#!/usr/bin/env node

"use strict";

const csswring = require("csswring");
const eachLimit = require("async").eachLimit;
const fs = require("fs");
const mkdirp = require("mkdirp");
const mqpacker = require("css-mqpacker");
const os = require("os");
const path = require("path");
const postcss = require("postcss");
const roundFloat = require("postcss-round-float");

const cpuNum = Math.max(1, os.cpus().length - 1);
const cssExt = ".css";
const minExt = ".min";
const processor = postcss([
  roundFloat(),
  mqpacker({
    sort: true
  }),
  csswring()
]);
const tmpdir = path.resolve(__dirname, "../tmp/");

eachLimit(fs.readdirSync(tmpdir), cpuNum, function (input, next) {
  const basename = path.basename(input, cssExt);

  let output;

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
