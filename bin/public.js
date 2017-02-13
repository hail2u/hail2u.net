#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const path = require("path");
const which = require("which").sync;

const cwd = path.resolve(__dirname, "../dist/");

execFile(which("git"), [
  "add",
  "--",
  process.argv
    .slice(2)
    .map((f) => {
      return path.relative(cwd, f);
    })
    .join(" ")
], {
  cwd: cwd
}, (e, o) => {
  if (e) {
    throw e;
  }

  process.stdout.write(o);
});
