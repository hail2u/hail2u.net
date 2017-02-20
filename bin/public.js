#!/usr/bin/env node

"use strict";

const execFileSync = require("child_process").execFileSync;
const path = require("path");
const which = require("which").sync;

const cwd = "../dist/";

process.chdir(__dirname);
execFileSync(which("git"), [
  "add",
  "--",
  process.argv
    .slice(2)
    .map((f) => {
      return path.relative(cwd, f);
    })
    .join(" ")
], {
  cwd: cwd,
  stdio: "inherit"
});
