#!/usr/bin/env node

"use strict";

const csswring = require("csswring");
const each = require("async").each;
const execFile = require("child_process").execFile;
const fs = require("fs-extra");
const mqpacker = require("css-mqpacker");
const path = require("path");
const postcss = require("postcss");
const roundFloat = require("postcss-round-float");
const which = require("which").sync;

const cssExt = ".css";
const minExt = ".min";
const processor = postcss([
  roundFloat(),
  mqpacker({
    sort: true
  }),
  csswring()
]);
const sassc = which("sassc");
const scssExt = ".scss";
const srcDir = path.resolve(__dirname, "../src/css/");
const tmpDir = path.resolve(__dirname, "../tmp/");

each(fs.readdirSync(srcDir), function (src, next) {
  const basename = path.basename(src, scssExt);
  let dest = path.join(tmpDir, `${basename}${cssExt}`);

  if (path.extname(src) !== scssExt || basename.startsWith("_")) {
    return next();
  }

  execFile(sassc, [
    path.join(srcDir, src).replace(/\\/g, "/"),
    dest
  ], function (err) {
    if (err) {
      next(err);
    }

    src = dest;
    dest = path.join(tmpDir, `${basename}${minExt}${cssExt}`);
    processor.process(fs.readFileSync(src, "utf8")).then(function (result) {
      fs.outputFileSync(dest, result.css);
      next();
    });
  });
}, function (err) {
  if (err) {
    throw err;
  }
});
