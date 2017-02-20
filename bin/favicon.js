#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const path = require("path");
const which = require("which").sync;

const files = [
  path.resolve(__dirname, "../tmp/favicon-16.png"),
  path.resolve(__dirname, "../tmp/favicon-32.png"),
  path.resolve(__dirname, "../tmp/favicon-64.png"),
  path.resolve(__dirname, "../tmp/favicon-256.png"),
  path.resolve(__dirname, "../dist/favicon.ico")
];

execFile(which("convert"), ["-quiet"].concat(files), (e) => {
  if (e) {
    throw e;
  }
});
