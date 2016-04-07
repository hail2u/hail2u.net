#!/usr/bin/env node

"use strict";

var spawn = require("child_process").spawnSync;
var which = require("which").sync;

var files = [
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
    dest: "tmp/favicon-16.png",
    src: "src/img/favicon.svg",
    width: 16
  },
  {
    dest: "tmp/favicon-32.png",
    src: "src/img/favicon.svg",
    width: 32
  },
  {
    dest: "tmp/favicon-64.png",
    src: "src/img/favicon-large.svg",
    width: 64
  },
  {
    dest: "tmp/favicon-256.png",
    src: "src/img/favicon-large.svg",
    width: 256
  },
  {
    dest: "dist/images/favicon-1024.png",
    src: "src/img/favicon-large.svg",
    width: 1024
  }
];

files.forEach(function (file) {
  var args = [
    "-f", file.src, "-e", file.dest
  ];
  var child;

  if (file.height) {
    args.push("-h");
    args.push(file.height);
  }

  if (file.width) {
    args.push("-w");
    args.push(file.width);
  }

  child = spawn(which("inkscape"), args, {
    stdio: "inherit"
  });

  if (child.error) {
    throw child.error;
  }
});
