#!/usr/bin/env node

"use strict";

const compile = require("google-closure-compiler-js").compile;
const each = require("async").each;
const fs = require("fs-extra");
const path = require("path");

const src = [
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

process.chdir(__dirname);
each(files, (f, next) => {
  f.contents = f.src.reduce((a, i) => {
    return `${a}${fs.readFileSync(i, "utf8")}`;
  }, "");
  fs.outputFileSync(f.dest, f.contents);
  f.dest = `../tmp/${path.basename(f.dest, jsExt)}${minExt}${jsExt}`;
  f.contents = compile({
    compilationLevel: "ADVANCED",
    jsCode: [{
      src: f.contents
    }],
    outputWrapper: "(function () {%output%}).call(window);"
  }).compiledCode;
  fs.outputFileSync(f.dest, f.contents);
  next();
}, (e) => {
  if (e) {
    throw e;
  }
});
