#!/usr/bin/env node

"use strict";

const compile = require("google-closure-compiler-js").compile;
const each = require("async").each;
const fs = require("fs");
const mkdirp = require("mkdirp").sync;
const path = require("path");

const src = [
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

process.chdir(__dirname);
each(src, (f, next) => {
  f.contents = f.src.reduce((a, i) => {
    return `${a}${fs.readFileSync(i, "utf8")}`;
  }, "");
  f.dest = path.join(tmp, f.dest);
  mkdirp(tmp);
  fs.writeFileSync(f.dest, f.contents);
  f.dest = path.join(tmp, `${path.basename(f.dest, jsExt)}${minExt}${jsExt}`);
  f.contents = compile({
    compilationLevel: "ADVANCED",
    jsCode: [{
      src: f.contents
    }],
    outputWrapper: "(function () {%output%}).call(window);"
  }).compiledCode;
  fs.writeFileSync(f.dest, f.contents);
  next();
}, (e) => {
  if (e) {
    throw e;
  }
});
