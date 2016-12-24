#!/usr/bin/env node

"use strict";

const each = require("async").each;
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");
const execFile = require("child_process").execFile;
const which = require("which").sync;

const argv = process.argv.slice(2);
const cssExt = ".css";
const destDir = path.resolve(__dirname, "../tmp/");
const sassc = which("sassc");
const scssExt = ".scss";
const srcDir = path.resolve(__dirname, "../src/css/");

each(
  fs.readdirSync(srcDir),
  function (src, next) {
    const basename = path.basename(src, scssExt);

    if (path.extname(src) !== scssExt || basename.startsWith("_")) {
      return next();
    }

    execFile(sassc, argv.concat([
      path.join(srcDir, src).replace(/\\/g, "/")
    ]), function (err, stdout) {
      const dest = path.join(destDir, `${basename}${cssExt}`);

      if (err) {
        return next(err);
      }

      mkdirp.sync(path.dirname(dest));
      fs.writeFileSync(dest, stdout);
      next();
    });
  }, function (err) {
    if (err) {
      throw err;
    }
  }
);
