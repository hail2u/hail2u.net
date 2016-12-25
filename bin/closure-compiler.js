#!/usr/bin/env node

"use strict";

const each = require("async").each;
const fs = require("fs-extra");
const compile = require("google-closure-compiler-js").compile;
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
    fs.outputFileSync(dest, compile({
      compilationLevel: "ADVANCED",
      outputWrapper: "(function () {%output%}).call(window);",
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
