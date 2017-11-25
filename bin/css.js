#!/usr/bin/env node

"use strict";

const atImport = require("postcss-import");
const csswring = require("csswring");
const fs = require("fs-extra");
const mqpacker = require("css-mqpacker");
const postcss = require("postcss");
const waterfall = require("../lib/waterfall");
const wrapWithSupports = require("../lib/wrap-with-supports");

const files = [
  {
    dest: "../tmp/main.min.css",
    src: "../src/css/main.css"
  },
  {
    dest: "../tmp/debug.min.css",
    src: "../src/css/debug.css"
  }
];
const styleGuide = {
  dest: "../dist/style-guide/index.html",
  src: "../src/css/test.html"
};

function read(processor, file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file.src, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      file.contents = d;
      resolve([processor, file]);
    });
  });
}

function optimize(processor, file) {
  return processor.process(file.contents, {
    from: file.src,
    to: file.dest
  })
    .then((r) => {
      file.contents = r.css;

      return file;
    });
}

function write(file) {
  return new Promise((resolve, reject) => {
    fs.outputFile(file.dest, file.contents, (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

function build(processor, file) {
  return waterfall([
    read,
    optimize,
    write
  ], [processor, file]);
}

function buildAll(processor) {
  return Promise.all(files.map(build.bind(null, processor)))
    .then(() => {
      return styleGuide;
    });
}

function modifyStyleGuide(file) {
  const dir = "../";
  const url = "https://hail2u.net/";

  file.contents = file.contents.replace(/\b(href|src)(=)(")(.*?)(")/g, (m, a, e, o, u, c) => {
    if (u.startsWith(url)) {
      u = u.substr(url.length - 1);
    } else if (u.startsWith(dir)) {
      u = u.substr(dir.length - 1);
    }

    return `${a}${e}${o}${u}${c}`;
  });

  return file;
}

process.chdir(__dirname);
waterfall([
  buildAll,
  read,
  modifyStyleGuide,
  write
], postcss([
  atImport(),
  mqpacker(),
  csswring(),
  wrapWithSupports()
]))
  .catch((e) => {
    console.error(e.stack);
    process.exit(1);
  });
