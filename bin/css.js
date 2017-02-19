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
  mqpacker(),
  csswring()
]);
const sassc = which("sassc");
const scssExt = ".scss";
const srcDir = path.resolve(__dirname, "../src/css/");
const tmpDir = path.resolve(__dirname, "../tmp/");

function writeCSS(basename, next, result) {
  fs.outputFile(path.join(tmpDir, `${basename}${minExt}${cssExt}`), result.css, (e) => {
    if (e) {
      return next(e);
    }

    next();
  });
}

function processCSS(basename, src, next, err) {
  if (err) {
    return next(err);
  }

  processor.process(fs.readFileSync(src, "utf8"))
    .then(writeCSS.bind(null, basename, next))
    .catch(next);
}

function toCSS(files) {
  each(files, (f, next) => {
    const basename = path.basename(f, scssExt);
    const dest = path.join(tmpDir, `${basename}${cssExt}`);

    if (path.extname(f) !== scssExt || basename.startsWith("_")) {
      return next();
    }

    execFile(sassc, [
      path.join(srcDir, f).replace(/\\/g, "/"),
      dest
    ], processCSS.bind(null, basename, dest, next));
  }, (e) => {
    if (e) {
      throw e;
    }
  });
}

fs.readdir(srcDir, (e, f) => {
  if (e) {
    throw e;
  }

  toCSS(f);
});
