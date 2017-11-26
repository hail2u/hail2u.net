#!/usr/bin/env node

"use strict";

const execFileSync = require("child_process").execFileSync;
const fs = require("fs-extra");
const minify = require("../lib/html-minifier");
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

function fixFilename(file) {
  return toPOSIXPath(path.relative(dir.data, file)
    .replace(/\.txt$/, ".html"));
}

function generatePath() {
  return fixFilename(path.resolve(argv.file));
}

function listImages(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(argv.file, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve([file, d.match(/\bsrc="\/img\/blog\/.*?"/g)]);
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

function copyImages([file, images]) {
  if (!images) {
    return file;
  }

  return Promise.all(images.map(copyImage))
    .then(() => {
      return file;
    });
}

function build(file) {
  const args = ["blosxom.cgi", `path=/${file}`];

  if (argv.reindex) {
    args.push("reindex=1");
    argv.reindex = false;
  }

  let html = execFileSync(perl, args, {
    cwd: dir.root,
    env: {
      BLOSXOM_CONFIG_DIR: path.resolve(dir.root)
    }
  });

  html = html.toString()
    .replace(/^[\s\S]*?\r?\n\r?\n/, "")
    .replace(/\b(href|src)(=")(https?:\/\/hail2u\.net\/)/g, "$1$2/")
    .trim();

  if (file.endsWith(".html")) {
    html = minify(html);
  }

  fs.outputFileSync(path.join(dir.static, file), html);
}

process.chdir(__dirname);
waterfall([
  generatePath,
  listImages,
  copyImages,
  build
])
  .catch((e) => {
    console.error(e.stack);
    process.exit(1);
  });
