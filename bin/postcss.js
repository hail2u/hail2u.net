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

const config = {
  cssExt: ".css",
  minExt: ".min",
  processor: postcss([
    roundFloat(),
    mqpacker({
      sort: true
    }),
    csswring()
  ]),
  tmpdir: "../tmp/"
};

config.tmpdir = path.resolve(__dirname, config.tmpdir);
eachLimit(
  fs.readdirSync(config.tmpdir),
  Math.max(1, os.cpus().length - 1),
  function (input, next) {
    const basename = path.basename(input, config.cssExt);

    var output;

    if (
      path.extname(input) !== config.cssExt ||
      path.extname(basename) === config.minExt
    ) {
      return next();
    }

    input = path.join(config.tmpdir, input);
    output = path.join(config.tmpdir, basename + config.minExt + config.cssExt);
    config.processor.process(
      fs.readFileSync(input, "utf8")
    ).then(function (result) {
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
