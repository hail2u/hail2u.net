#!/usr/bin/env node

"use strict";

var minimist = require("minimist");
var path = require("path");
var spawn = require("child_process").spawnSync;
var which = require("which").sync;

var argv = minimist(process.argv.slice(2));
var cmd = which("git");
var file = path.relative("dist", argv._[0]);
var git;
var opts = {
  cwd: "dist/",
  stdio: "inherit"
};

git = spawn(cmd, [
  "add",
  "--",
  file
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
