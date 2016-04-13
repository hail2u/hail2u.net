#!/usr/bin/env node

"use strict";

var minimist = require("minimist");
var path = require("path");
var spawn = require("child_process").spawnSync;
var which = require("which").sync;

var argv = minimist(process.argv.slice(2), {
  string: ["file"]
});
var cmd = which("git");
var cwd = "../dist/";
var git;
var opts = {
  stdio: "inherit"
};

cwd = path.resolve(__dirname, cwd);
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
