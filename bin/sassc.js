#!/usr/bin/env node

"use strict";

const eachLimit = require("async").eachLimit;
const fs = require("fs");
const mkdirp = require("mkdirp");
const os = require("os");
const path = require("path");
const execFile = require("child_process").execFile;
const which = require("which").sync;

const argv = process.argv.slice(2);
const cpuNum = Math.max(1, os.cpus().length - 1);
const cssExt = ".css";
const destDir = path.resolve(__dirname, "../tmp/");
const scssExt = ".scss";
const srcDir = path.resolve(__dirname, "../src/css/");

function sl(p) {
  return p.replace(/\\/g, "/");
}

eachLimit(fs.readdirSync(srcDir), cpuNum, function (src, next) {
  const basename = path.basename(src, scssExt);

  if (path.extname(src) !== scssExt || basename.startsWith("_")) {
    return next();
  }

  execFile(which("sassc"), argv.concat([
    sl(path.join(srcDir, src))
  ]), function (err, stdout) {
    var dest;

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
});
