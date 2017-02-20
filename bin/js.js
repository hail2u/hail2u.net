#!/usr/bin/env node

"use strict";

const each = require("async").each;
const fs = require("fs-extra");
const compile = require("google-closure-compiler-js").compile;
const path = require("path");

const files = [
  {
    "dest": "../tmp/debug.js",
    "src": [
      "../src/js/toggle-column.js",
      "../src/js/toggle-eyecatch.js",
      "../src/js/toggle-outline.js"
    ]
  },
  {
    "dest": "../tmp/main.js",
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

function minify(file, next) {
  file.contents = file.src.reduce((c, s) => {
    return `${c}${fs.readFileSync(path.resolve(__dirname, s), "utf8")}`;
  }, "");
  fs.outputFileSync(path.resolve(__dirname, file.dest), file.contents);
  file.dest = `../tmp/${path.basename(file.dest, jsExt)}${minExt}${jsExt}`;
  fs.outputFileSync(path.resolve(__dirname, file.dest), compile({
    compilationLevel: "ADVANCED",
    jsCode: [{
      src: file.contents
    }],
    outputWrapper: "(function () {%output%}).call(window);"
  }).compiledCode);
  next();
}

each(files, minify, (e) => {
  if (e) {
    throw e;
  }
});
