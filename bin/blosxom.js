#!/usr/bin/env node

"use strict";

const execFileSync = require("child_process").execFileSync;
const fs = require("fs-extra");
const minifyHTML = require("../lib/html-minifier");
const minimist = require("minimist");
const path = require("path");
const toPOSIXPath = require("../lib/to-posix-path");
const waterfall = require("../lib/waterfall");
const which = require("which").sync;

const argv = minimist(process.argv.slice(2), {
  boolean: ["reindex"],
  string: ["file"]
});
const dir = {
  data: "../src/blosxom/entries/",
  img: "../src/img/blog/",
  root: "../src/blosxom/",
  static: "../dist/blog/",
  staticimg: "../dist/img/blog/"
};
const perl = which("perl");

function listImages() {
  return new Promise((resolve, reject) => {
    fs.readFile(argv.file, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve(d.match(/\bsrc="\/img\/blog\/.*?"/g));
    });
  });
}

function copyImage(image) {
  image = path.basename(image.split(/"/)[1]);

  return new Promise((resolve, reject) => {
    fs.copy(path.join(dir.img, image), path.join(dir.staticimg, image), (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

function copyImages(images) {
  if (!images) {
    return;
  }

  return Promise.all(images.map(copyImage));
}

function build() {
  const file = toPOSIXPath(path.relative(dir.data, path.resolve(argv.file))
    .replace(/\.txt$/, ".html"));
  const args = ["blosxom.cgi", `path=/${file}`];

  if (argv.reindex) {
    args.push("reindex=1");
    argv.reindex = false;
  }

  const html = execFileSync(perl, args, {
    cwd: dir.root,
    env: {
      BLOSXOM_CONFIG_DIR: path.resolve(dir.root)
    }
  })
    .toString()
    .replace(/^[\s\S]*?\r?\n\r?\n/, "")
    .replace(/\b(href|src)(=")(https?:\/\/hail2u\.net\/)/g, "$1$2/")
    .trim();

  return [path.join(dir.static, file), minifyHTML(html)];
}

function write([file, data]) {
  return new Promise((resolve, reject) => {
    fs.outputFile(file, data, (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

process.chdir(__dirname);
waterfall([
  listImages,
  copyImages,
  build,
  write
])
  .catch((e) => {
    throw e;
  });
