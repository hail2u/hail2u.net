#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
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
    area: "0:224:1024:800",
    dest: "../dist/images/cover.png",
    src: "../src/img/favicon-large.svg",
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

function toPNG(file) {
  return new Promise((resolve, reject) => {
    const args = ["-f", file.src, "-e", file.dest];

    if (file.area) {
      args.push("-a", file.area);
    }

    if (file.height) {
      args.push("-h", file.height);
    }

    if (file.width) {
      args.push("-w", file.width);
    }

    execFile(inkscape, args, (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

process.chdir(__dirname);
Promise.all(files.map(toPNG))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
