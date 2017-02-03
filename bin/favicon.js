#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const path = require("path");
const which = require("which").sync;

const files = [
  "../tmp/favicon-16.png",
  "../tmp/favicon-32.png",
  "../tmp/favicon-64.png",
  "../tmp/favicon-256.png",
  "../dist/favicon.ico"
].map((p) => {
  return path.resolve(__dirname, p);
});

execFile(which("convert"), ["-quiet"].concat(files), (e) => {
  if (e) {
    throw e;
  }
});
