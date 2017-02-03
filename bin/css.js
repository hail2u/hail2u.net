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

function writeCSS(dest, next, result) {
  fs.outputFileSync(dest, result.css);

  return next();
}

function processCSS(basename, dest, next, err) {
  if (err) {
    return next(err);
  }

  const src = dest;

  dest = path.join(tmpDir, `${basename}${minExt}${cssExt}`);
  processor.process(fs.readFileSync(src, "utf8"))
    .then(writeCSS.bind(null, dest, next))
    .catch(next);
}

function toCSS(src, next) {
  const basename = path.basename(src, scssExt);
  const dest = path.join(tmpDir, `${basename}${cssExt}`);

  if (path.extname(src) !== scssExt || basename.startsWith("_")) {
    return next();
  }

  execFile(sassc, [
    path.join(srcDir, src).replace(/\\/g, "/"),
    dest
  ], processCSS.bind(null, basename, dest, next));
}

each(fs.readdirSync(srcDir), toCSS, (e) => {
  if (e) {
    throw e;
  }
});
