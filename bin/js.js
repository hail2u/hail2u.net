#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const gccc = require("google-closure-compiler-js").compile;
const path = require("path");

const files = [
  {
    "dest": "debug.js",
    "src": [
      "../src/js/toggle-column.js",
      "../src/js/toggle-eyecatch.js",
      "../src/js/toggle-outline.js"
    ]
  },
  {
    "dest": "main.js",
    "src": [
      "../src/js/abbread.js",
      "../src/js/ellipsis-title.js",
      "../src/js/reldate.js",
      "../src/js/unutm.js",
      "../src/js/wrapfix.js"
    ]
  }
];
const jsExt = ".js";
const minExt = ".min";
const tmp = "../tmp/";

function read(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve(d);
    });
  });
}

function gather(file) {
  return Promise.all(file.src.map(read))
    .then((r) => {
      file.contents = r;

      return file;
    });
}

function concat(file) {
  file.contents = file.contents.join("");
  file.dest = path.join(tmp, file.dest);

  return file;
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

function compile(file) {
  file.contents = gccc({
    compilationLevel: "ADVANCED",
    jsCode: [{
      src: file.contents
    }],
    outputWrapper: "(function () {%output%}).call(window);"
  }).compiledCode;
  file.dest = path.join(tmp, `${path.basename(file.dest, jsExt)}${minExt}${jsExt}`);

  return file;
}

function build(file) {
  return Promise.resolve(file)
    .then(gather)
    .then(concat)
    .then(write)
    .then(compile)
    .then(write);
}

process.chdir(__dirname);
Promise.all(files.map(build))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
