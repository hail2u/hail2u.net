#!/usr/bin/env node

"use strict";

const execFileSync = require("child_process").execFileSync;
const path = require("path");
const which = require("which").sync;

const src = "../src/weblog/entries/";
const dest = "../dist/blog/";
let file = process.argv.slice(2).shift();

process.chdir(__dirname);
file = path.resolve("../", file);

if (file.endsWith(".txt")) {
  file = path.join(
    dest,
    path.relative(src, path.dirname(file)),
    `${path.basename(file, ".txt")}.html`
  )
}

execFileSync(which("htmlhint"), [
  "--config",
  "../.htmlhintrc",
  file
], {
  stdio: "inherit"
});
