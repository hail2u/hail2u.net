#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFileSync;
const minimist = require("minimist");
const path = require("path");
const which = require("which").sync;

const argv = minimist(process.argv.slice(2), {
  string: ["file"]
});
const cmd = which("git");
const cwd = path.resolve(__dirname, "../dist/");
const opts = {
  cwd: cwd,
  stdio: "inherit"
};

execFile(cmd, ["add", "--", path.relative(cwd, argv.file)], opts);
execFile(cmd, ["commit", "--message=Upload"], opts);
execFile(cmd, ["push", "origin", "gh-pages"], opts);
