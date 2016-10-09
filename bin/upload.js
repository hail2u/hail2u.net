#!/usr/bin/env node

"use strict";

const minimist = require("minimist");
const path = require("path");
const spawn = require("child_process").spawnSync;
const which = require("which").sync;

const argv = minimist(process.argv.slice(2), {
  string: ["file"]
});
const cmd = which("git");
const cwd = path.resolve(__dirname, "../dist/");
const opts = {
  stdio: "inherit"
};

let git;

opts.cwd = cwd;
git = spawn(cmd, [
  "add",
  "--",
  path.relative(cwd, argv.file)
], opts);

if (git.error) {
  throw git.error;
}

git = spawn(cmd, [
  "commit",
  "--message=Upload"
], opts);

if (git.error) {
  throw git.error;
}

git = spawn(cmd, [
  "push",
  "origin",
  "gh-pages"
], opts);

if (git.error) {
  throw git.error;
}
