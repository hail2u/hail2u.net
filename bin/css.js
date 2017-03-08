#!/usr/bin/env node

"use strict";

const csswring = require("csswring");
const execFileSync = require("child_process").execFileSync;
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

process.chdir(__dirname);
fs.readdirSync(scss).forEach((f) => {
  const basename = path.basename(f, scssExt);

  if (path.extname(f) !== scssExt || basename.startsWith("_")) {
    return false;
  }

  const dest = path.join(tmp, `${basename}${cssExt}`);
  const css = execFileSync(sassc, [
    path.join(scss, f).replace(/\\/g, "/"),
  ], {
    encoding: "utf8"
  });

  fs.outputFileSync(dest, css);
  processor.process(css).then((r) => {
    fs.outputFileSync(path.join(tmp, `${basename}${minExt}${cssExt}`), r.css);
  });
});
