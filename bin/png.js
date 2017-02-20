#!/usr/bin/env node

"use strict";

const each = require("async").each;
const execFileSync = require("child_process").execFileSync;
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

process.chdir(__dirname);
each(files, (f, next) => {
  let args = ["-f", f.src, "-e", f.dest];

  if (f.area) {
    args = args.concat([
      "-a",
      f.area
    ]);
  }

  if (f.height) {
    args = args.concat([
      "-h",
      f.height
    ]);
  }

  if (f.width) {
    args = args.concat([
      "-w",
      f.width
    ]);
  }

  execFileSync(inkscape, args);
  next();
}, (e) => {
  if (e) {
    throw e;
  }
});
