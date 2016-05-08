#!/usr/bin/env node

"use strict";

var path = require("path");
var spawn = require("child_process").spawnSync;
var which = require("which").sync;

[
  {
    dest: "../dist/apple-touch-icon-precomposed.png",
    src: "../src/img/favicon-large.svg",
    width: 180
  },
  {
    dest: "../dist/images/cover.png",
    src: "../src/img/cover.svg",
    width: 2560
  },
  {
    dest: "../dist/images/favicon-1024.png",
    src: "../src/img/favicon-large.svg",
    width: 1024
  },
  {
    dest: "../tmp/favicon-16.png",
    src: "../src/img/favicon.svg",
    width: 16
  },
  {
    dest: "../tmp/favicon-256.png",
    src: "../src/img/favicon-large.svg",
    width: 256
  },
  {
    dest: "../tmp/favicon-32.png",
    src: "../src/img/favicon.svg",
    width: 32
  },
  {
    dest: "../tmp/favicon-64.png",
    src: "../src/img/favicon-large.svg",
    width: 64
  }
].forEach(function (file) {
  var args = [
    "-f",
    path.resolve(__dirname, file.src),
    "-e",
    path.resolve(__dirname, file.dest)
  ];
  var inkscape;

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

  inkscape = spawn(which("inkscape"), args, {
    stdio: "inherit"
  });

  if (inkscape.error) {
    throw inkscape.error;
  }
});
