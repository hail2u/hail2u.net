#!/usr/bin/env node

"use strict";

const each = require("async").each;
const execFile = require("child_process").execFile;
const path = require("path");
const which = require("which").sync;

const files = [
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
    area: "0:224:1024:800",
    width: 2560
  },
  {
    dest: "../tmp/favicon-16.png",
    src: "../src/img/favicon.svg",
    width: 16
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
  },
  {
    dest: "../tmp/favicon-256.png",
    src: "../src/img/favicon-large.svg",
    width: 256
  }
];
const inkscape = which("inkscape");

each(files, function (file, next) {
  let args = [
    "-f",
    path.resolve(__dirname, file.src),
    "-e",
    path.resolve(__dirname, file.dest)
  ];

  if (file.area) {
    args = args.concat([
      "-a",
      file.area
    ]);
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

  execFile(inkscape, args, next);
}, function (err) {
  if (err) {
    throw err;
  }
});
