#!/usr/bin/env node

"use strict";

const execFileSync = require("child_process").execFileSync;
const path = require("path");
const which = require("which").sync;

const cwd = "../dist/";
const root = "../";

process.chdir(__dirname);
execFileSync(which("git"), [
  "add",
  "--",
  process.argv
    .slice(2)
    .map((f) => {
      return path.resolve(root, f);
    })
    .join(" ")
], {
  cwd: cwd,
  stdio: "inherit"
});
