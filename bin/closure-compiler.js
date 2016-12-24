#!/usr/bin/env node

"use strict";

const each = require("async").each;
const fs = require("fs");
const compile = require("google-closure-compiler-js").compile;
const mkdirp = require("mkdirp");
const path = require("path");

const jsExt = ".js";
const minExt = ".min";
const tmpdir = path.resolve(__dirname, "../tmp");

each(
  fs.readdirSync(tmpdir),
  function (src, next) {
    const basename = path.basename(src, jsExt);
    const dest = path.join(tmpdir, `${basename}${minExt}${jsExt}`);

    if (path.extname(src) !== jsExt || path.extname(basename) === minExt) {
      return next();
    }

    src = path.join(tmpdir, src);
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
