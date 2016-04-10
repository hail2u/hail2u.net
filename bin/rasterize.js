#!/usr/bin/env node

"use strict";

var spawn = require("child_process").spawnSync;
var which = require("which").sync;

var tmpdir = process.env.npm_package_config_tmpdir;

[
  {
    dest: "dist/apple-touch-icon-precomposed.png",
    src: "src/img/favicon-large.svg",
    width: 180
  },
  {
    dest: "dist/images/cover.png",
    src: "src/img/cover.svg",
    width: 180
  },
  {
    dest: "dist/images/favicon-1024.png",
    src: "src/img/favicon-large.svg",
    width: 1024
  },
  {
    dest: tmpdir + "favicon-16.png",
    src: "src/img/favicon.svg",
    width: 16
  },
  {
    dest: tmpdir + "favicon-256.png",
    src: "src/img/favicon-large.svg",
    width: 256
  },
  {
    dest: tmpdir + "favicon-32.png",
    src: "src/img/favicon.svg",
    width: 32
  },
  {
    dest: tmpdir + "favicon-64.png",
    src: "src/img/favicon-large.svg",
    width: 64
  }
].forEach(function (file) {
  var args = [
    "-f",
    file.src,
    "-e",
    file.dest
  ];
  var child;

  if (!file.src || !file.dest) {
    return;
  }

  if (file.height) {
    args = args.concat([
      "-h",
      file.height
    ]);
  }

  if (file.width) {
    args = args.concat([
      "-w",
      file.width
    ]);
  }

  child = spawn(which("inkscape"), args, {
    stdio: "inherit"
  });

  if (child.error) {
    throw child.error;
  }
});
