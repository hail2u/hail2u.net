#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFileSync;
const fs = require("fs-extra");
const path = require("path");
const which = require("which").sync;

const cmd = which("git");
const cwd = path.resolve(__dirname, "../dist/");
const opts = {
  cwd: cwd,
  stdio: "inherit"
};

process.argv.slice(2).forEach(function (f) {
  if (fs.existsSync(f)) {
    execFile(cmd, ["add", "--", path.relative(cwd, f)], opts);
  }
});
execFile(cmd, ["commit", "--message=Upload"], opts);
execFile(cmd, ["push", "origin", "gh-pages"], opts);
