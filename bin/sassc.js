#!/usr/bin/env node

"use strict";

const eachLimit = require("async").eachLimit;
const fs = require("fs");
const mkdirp = require("mkdirp");
const os = require("os");
const path = require("path");
const execFile = require("child_process").execFile;
const which = require("which").sync;

const config = {
  cssExt: ".css",
  destDir: "../tmp/",
  scssExt: ".scss",
  srcDir: "../src/css/"
};

var argv = process.argv.slice(2);

config.destDir = path.resolve(__dirname, config.destDir);
config.srcDir = path.resolve(__dirname, config.srcDir);
eachLimit(
  fs.readdirSync(config.srcDir),
  Math.max(1, os.cpus().length - 1),
  function (src, next) {
    const basename = path.basename(src, config.scssExt);

    if (path.extname(src) !== config.scssExt || basename.startsWith("_")) {
      return next();
    }

    execFile(which("sassc"), argv.concat([
      path.join(config.srcDir, src).replace(/\\/g, "/")
    ]), function (err, stdout) {
      var dest;

      if (err) {
        return next(err);
      }

      dest = path.join(config.destDir, basename + config.cssExt);
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
