#!/usr/bin/env node

"use strict";

const csswring = require("csswring");
const each = require("async").each;
const fs = require("fs");
const mkdirp = require("mkdirp");
const mqpacker = require("css-mqpacker");
const path = require("path");
const postcss = require("postcss");
const roundFloat = require("postcss-round-float");

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

each(
  fs.readdirSync(tmpdir),
  function (input, next) {
    const basename = path.basename(input, cssExt);
    const output = path.join(tmpdir, `${basename}${minExt}${cssExt}`);

    if (path.extname(input) !== cssExt || path.extname(basename) === minExt) {
      return next();
    }

    input = path.join(tmpdir, input);
    processor.process(fs.readFileSync(input, "utf8")).then(function (result) {
      mkdirp.sync(path.dirname(output));
      fs.writeFileSync(output, result.css);
      next();
    });
  }, function (err) {
    if (err) {
      throw err;
    }
  }
);
