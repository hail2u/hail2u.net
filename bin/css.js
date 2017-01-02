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
const dos2unix = which("dos2unix");
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

function postPostCSS(dest, next, result) {
  fs.outputFileSync(dest, result.css);

  return next();
}

function postDOS2Unix(basename, dest, next, err) {
  if (err) {
    return next(err);
  }

  const src = dest;

  dest = path.join(tmpDir, `${basename}${minExt}${cssExt}`);
  processor.process(fs.readFileSync(src, "utf8"))
    .then(postPostCSS.bind(null, dest, next));
}

function postSassc(basename, dest, next, err) {
  if (err) {
    return next(err);
  }

  execFile(dos2unix, [dest], postDOS2Unix.bind(null, basename, dest, next));
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
  ], postSassc.bind(null, basename, dest, next));
}

function cb(err) {
  if (err) {
    throw err;
  }
}

each(fs.readdirSync(srcDir), toCSS, cb);
