#!/usr/bin/env node

"use strict";

var async = require("async");
var os = require("os");
var path = require("path");
var spawn = require("child_process").spawnSync;
var which = require("which").sync;

var cpuNum = Math.max(1, os.cpus().length - 1);
var files = [
  {
    dest: "../dist/images/about/how-i-markup-and-style-this-website.png",
    src: "../src/img/about/how-i-markup-and-style-this-website.svg",
    width: 2560
  },
  {
    dest: "../dist/apple-touch-icon-precomposed.png",
    src: "../src/img/favicon-large.svg",
    width: 180
  },
  {
    dest: "../dist/images/cover.png",
    src: "../src/img/favicon-large.svg",
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
];

async.eachLimit(files, cpuNum, function (file, next) {
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

  inkscape = spawn(which("inkscape"), args);
  next(inkscape.err);
}, function (err) {
  if (err) {
    throw err;
  }
});
