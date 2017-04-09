#!/usr/bin/env node

"use strict";

const csswring = require("csswring");
const execFile = require("child_process").execFile;
const fs = require("fs-extra");
const mqpacker = require("css-mqpacker");
const path = require("path");
const postcss = require("postcss");
const roundFloat = require("postcss-round-float");
const toPOSIXPath = require("../lib/to-posix-path");
const waterfall = require("../lib/waterfall");
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
const src = "../src/css/";
const tmp = "../tmp/";

function toObject(file) {
  const basename = path.basename(file.src, scssExt);

  return {
    basename: basename,
    dest: path.join(tmp, `${basename}${cssExt}`),
    src: path.join(src, file)
  };
}

function isSCSS(file) {
  if (path.extname(file.src) !== scssExt || file.basename.startsWith("_")) {
    return false;
  }

  return true;
}

function list(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (e, f) => {
      if (e) {
        return reject(e);
      }

      resolve(f.map(toObject).filter(isSCSS));
    });
  });
}

function compile(file) {
  return new Promise((resolve, reject) => {
    execFile(sassc, [
      toPOSIXPath(file.src)
    ], (e, d) => {
      if (e) {
        return reject(e);
      }

      file.contents = d;
      resolve(file);
    });
  });
}

function write(file) {
  return new Promise((resolve, reject) => {
    fs.outputFile(file.dest, file.contents, (e) => {
      if (e) {
        return reject(e);
      }

      resolve(file);
    });
  });
}

function optimize(file) {
  return processor.process(file.contents).then((r) => {
    file.contents = r.css;
    file.dest = path.join(tmp, `${file.basename}${minExt}${cssExt}`);

    return file;
  });
}

function build(file) {
  return waterfall([
    compile,
    write,
    optimize,
    write
  ], file);
}

function buildAll(files) {
  return Promise.all(files.map(build));
}

process.chdir(__dirname);
waterfall([
  list,
  buildAll
], src).catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
