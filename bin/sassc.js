#!/usr/bin/env node

"use strict";

const eachLimit = require("async").eachLimit;
const fs = require("fs");
const mkdirp = require("mkdirp");
const os = require("os");
const path = require("path");
const execFile = require("child_process").execFile;

const argv = process.argv.slice(2);
const cmd = "sassc";
const cssExt = ".css";
const destDir = path.resolve(__dirname, "../tmp/");
const scssExt = ".scss";
const srcDir = path.resolve(__dirname, "../src/css/");

eachLimit(
  fs.readdirSync(srcDir),
  Math.max(1, os.cpus().length - 1),
  function (src, next) {
    const basename = path.basename(src, scssExt);

    if (path.extname(src) !== scssExt || basename.startsWith("_")) {
      return next();
    }

    execFile(cmd, argv.concat([
      path.join(srcDir, src).replace(/\\/g, "/")
    ]), function (err, stdout) {
      let dest;

      if (err) {
        return next(err);
      }

      dest = path.join(destDir, basename + cssExt);
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
