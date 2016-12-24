#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFileSync;
const path = require("path");
const which = require("which").sync;

const file = process.argv[2];
const cmd = which("git");
const cwd = path.resolve(__dirname, "../dist/");
const opts = {
  cwd: cwd,
  stdio: "inherit"
};

execFile(cmd, ["add", "--", path.relative(cwd, file)], opts);
execFile(cmd, ["commit", "--message=Upload"], opts);
execFile(cmd, ["push", "origin", "gh-pages"], opts);
