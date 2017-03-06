#!/usr/bin/env node

"use strict";

const csswring = require("csswring");
const execFileSync = require("child_process").execFileSync;
const fs = require("fs");
const mkdirp = require("mkdirp").sync;
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
const src = "../src/css/";
const tmp = "../tmp/";

process.chdir(__dirname);
fs.readdirSync(src).forEach((f) => {
  const basename = path.basename(f, scssExt);
  const dest = path.join(tmp, `${basename}${cssExt}`);

  if (path.extname(f) !== scssExt || basename.startsWith("_")) {
    return false;
  }

  mkdirp(tmp);
  execFileSync(sassc, [
    path.join(src, f).replace(/\\/g, "/"),
    dest
  ]);
  processor.process(fs.readFileSync(dest, "utf8")).then((r) => {
    fs.writeFileSync(path.join(tmp, `${basename}${minExt}${cssExt}`), r.css);
  });
});
