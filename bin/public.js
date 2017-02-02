#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFileSync;
const path = require("path");
const which = require("which").sync;

const cwd = path.resolve(__dirname, "../dist/");

process.argv.slice(2).forEach((f) => {
  execFile(which("git"), ["add", "--", path.relative(cwd, f)], {
    cwd: cwd,
    stdio: "inherit"
  });
});
