#!/usr/bin/env node

"use strict";

const each = require("async").each;
const fs = require("fs-extra");
const path = require("path");
const execFile = require("child_process").execFile;
const which = require("which").sync;

const cssExt = ".css";
const destDir = path.resolve(__dirname, "../tmp/");
const sassc = which("sassc");
const scssExt = ".scss";
const srcDir = path.resolve(__dirname, "../src/css/");

each(fs.readdirSync(srcDir), function (src, next) {
  const basename = path.basename(src, scssExt);

  if (path.extname(src) !== scssExt || basename.startsWith("_")) {
    return next();
  }

  execFile(sassc, [
    path.join(srcDir, src).replace(/\\/g, "/"),
    path.join(destDir, `${basename}${cssExt}`)
  ], function (err) {
    next(err);
  });
}, function (err) {
  if (err) {
    throw err;
  }
});
