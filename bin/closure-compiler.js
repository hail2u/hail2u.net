#!/usr/bin/env node

"use strict";

const eachLimit = require("async").eachLimit;
const fs = require("fs");
const compile = require("google-closure-compiler-js").compile;
const mkdirp = require("mkdirp");
const os = require("os");
const path = require("path");

const config = {
  jsExt: ".js",
  minExt: ".min",
  tmpdir: "../tmp"
};

config.tmpdir = path.resolve(__dirname, config.tmpdir);
eachLimit(
  fs.readdirSync(config.tmpdir),
  Math.max(1, os.cpus().length - 1),
  function (src, next) {
    const basename = path.basename(src, config.jsExt);

    var dest;

    if (
      path.extname(src) !== config.jsExt ||
      path.extname(basename) === config.minExt
    ) {
      return next();
    }

    src = path.join(config.tmpdir, src);
    dest = path.join(config.tmpdir, basename + config.minExt + config.jsExt);
    mkdirp.sync(path.dirname(dest));
    fs.writeFileSync(dest, compile({
      jsCode: [{
        src: fs.readFileSync(src, "utf8")
      }]
    }).compiledCode);
    next();
  }, function (err) {
    if (err) {
      throw err;
    }
  }
);
