#!/usr/bin/env node

"use strict";

const minimist = require("minimist");
const path = require("path");
const spawn = require("child_process").spawnSync;
const which = require("which").sync;

const config = {
  cwd: "../dist"
};

var argv = minimist(process.argv.slice(2), {
  string: ["file"]
});
var cmd = which("git");
var git;
var opts = {
  stdio: "inherit"
};

config.cwd = path.resolve(__dirname, config.cwd);
opts.cwd = config.cwd;
git = spawn(cmd, [
  "add",
  "--",
  path.relative(config.cwd, argv.file)
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
