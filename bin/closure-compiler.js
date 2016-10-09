#!/usr/bin/env node

"use strict";

const eachLimit = require("async").eachLimit;
const fs = require("fs");
const compile = require("google-closure-compiler-js").compile;
const mkdirp = require("mkdirp");
const os = require("os");
const path = require("path");

const jsExt = ".js";
const minExt = ".min";
const tmpdir = path.resolve(__dirname, "../tmp");

eachLimit(fs.readdirSync(tmpdir), Math.max(1, os.cpus().length - 1), function (src, next) {
  const basename = path.basename(src, jsExt);

  let dest;

  if (path.extname(src) !== jsExt || path.extname(basename) === minExt) {
    return next();
  }

  src = path.join(tmpdir, src);
  dest = path.join(tmpdir, basename + minExt + jsExt);
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
});
