#!/usr/bin/env node

"use strict";

const csswring = require("csswring");
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
const scss = "../src/css/";
const tmp = "../tmp/";

function toObject(file) {
  return {
    src: file
  };
}

function isSCSS(file) {
  file.basename = path.basename(file.src, scssExt);

  if (path.extname(file.src) !== scssExt || file.basename.startsWith("_")) {
    return false;
  }

  return true;
}

function listSCSSFiles() {
  return new Promise((resolve, reject) => {
    fs.readdir(scss, (e, f) => {
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
      path.join(scss, file.src).replace(/\\/g, "/")
    ], (e, d) => {
      if (e) {
        return reject(e);
      }

      file.contents = d;
      file.dest = path.join(tmp, `${file.basename}${cssExt}`);
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
  return Promise.resolve(file)
    .then(compile)
    .then(write)
    .then(optimize)
    .then(write);
}

function buildAll(files) {
  return Promise.all(files.map(build));
}

process.chdir(__dirname);
Promise.resolve()
  .then(listSCSSFiles)
  .then(buildAll)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
