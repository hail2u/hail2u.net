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
var cwd = "dist/";
var file = path.relative(cwd, argv.file);
var git;
var opts = {
  cwd: cwd,
  stdio: "inherit"
};

fs.accessSync(argv.file);
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
