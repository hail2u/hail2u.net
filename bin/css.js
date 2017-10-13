#!/usr/bin/env node

"use strict";

const atImport = require("postcss-import");
const csswring = require("csswring");
const fs = require("fs-extra");
const moveFontFace = require("../lib/move-font-face");
const mqpacker = require("css-mqpacker");
const postcss = require("postcss");
const waterfall = require("../lib/waterfall");
const wrapWithSupports = require("../lib/wrap-with-supports");

const files = [
  {
    dest: "../tmp/main.min.css",
    src: "../src/css/main.css"
  },
  {
    dest: "../tmp/debug.min.css",
    src: "../src/css/debug.css"
  }
];
const processor = postcss([
  atImport(),
  mqpacker(),
  csswring(),
  wrapWithSupports(),
  moveFontFace()
]);

function read(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file.src, (e, d) => {
      if (e) {
        return reject(e);
      }

      file.contents = d;
      resolve(file);
    });
  });
}

function optimize(file) {
  return processor.process(file.contents, {
    from: file.src,
    to: file.dest
  }).then((r) => {
    file.contents = r.css;

    return file;
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

function build(file) {
  return waterfall([
    read,
    optimize,
    write
  ], file);
}

process.chdir(__dirname);
Promise.all(files.map(build))
  .catch((e) => {
    console.error(e.stack);
    process.exit(1);
  });
