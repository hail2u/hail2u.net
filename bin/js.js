#!/usr/bin/env node

"use strict";

const each = require("async").each;
const fs = require("fs-extra");
const compile = require("google-closure-compiler-js").compile;
const path = require("path");

const files = [
  {
    "dest": "debug.js",
    "src": [
      "toggle-column.js",
      "toggle-eyecatch.js",
      "toggle-outline.js"
    ]
  },
  {
    "dest": "main.js",
    "src": [
      "abbread.js",
      "ellipsis-title.js",
      "reldate.js",
      "unutm.js",
      "wrapfix.js"
    ]
  }
];
const jsExt = ".js";
const minExt = ".min";
const tmpdir = path.resolve(__dirname, "../tmp");

function minify(file, next) {
  const contents = file.src.reduce((c, s) => {
    return `${c}${fs.readFileSync(path.resolve(tmpdir, s), "utf8")}`;
  }, "");

  fs.outputFileSync(path.resolve(tmpdir, file.dest), contents);
  file.dest = `${path.basename(file.dest, jsExt)}${minExt}${jsExt}`;
  fs.outputFileSync(path.resolve(tmpdir, file.dest), compile({
    compilationLevel: "ADVANCED",
    outputWrapper: "(function () {%output%}).call(window);",
    jsCode: [{
      src: contents
    }]
  }).compiledCode);
  next();
}

each(files, minify, (err) => {
  if (err) {
    throw err;
  }
});
