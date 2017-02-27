#!/usr/bin/env node

"use strict";

const execFileSync = require("child_process").execFileSync;
const which = require("which").sync;

const dest = "../dist/favicon.ico";
const src = [
  "../tmp/favicon-16.png",
  "../tmp/favicon-32.png",
  "../tmp/favicon-64.png",
  "../tmp/favicon-256.png"
];

process.chdir(__dirname);
execFileSync(which("convert"), ["-quiet"].concat(src).concat(dest));
