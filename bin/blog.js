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
  boolean: [
    "all",
    "reindex"
  ],
  string: ["file"]
});
const dir = {
  data: "../src/weblog/entries/",
  img: "../src/img/blog/",
  root: "../src/weblog/",
  static: "../dist/blog/",
  staticimg: "../dist/images/blog/"
};
const index = "../src/weblog/plugins/state/files_index.dat";
const perl = which("perl");

function listAll() {
  if (!argv.all) {
    return [];
  }

  return new Promise((resolve, reject) => {
    fs.readFile(index, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve(d.split(/\r?\n/)
        .filter((f) => {
          return f;
        })
        .map((f) => {
          return f.split("=>").shift();
        }));
    });
  });
}

function listFromArgv(files) {
  if (!argv.file) {
    return files;
  }

  files.push(path.resolve(argv.file));
  files.push(path.join(dir.data, "index.rss"));

  return files;
}

function fixFilename(file) {
  return toPOSIXPath(path.relative(dir.data, file).replace(/\.txt$/, ".html"));
}

function fix(files) {
  return files.map(fixFilename);
}

function listImages(files) {
  if (!argv.file) {
    return [files, null];
  }

  return new Promise((resolve, reject) => {
    fs.readFile(argv.file, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve([files, d.match(/\bsrc="\/images\/blog\/.*?"/g)]);
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

function copyImages([files, images]) {
  if (!images) {
    return files;
  }

  return Promise.all(images.map(copyImage)).then(() => {
    return files;
  });
}

function buildAll(files) {
  files.forEach((f) => {
    const args = ["blosxom.cgi", `path=/${f}`];

    if (argv.reindex) {
      args.push("reindex=1");
      argv.reindex = false;
    }

    if (f === "index.rss") {
      f = "feed";
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

    if (f.endsWith(".html")) {
      html = minify(html);
    }

    f = path.join(dir.static, f);
    fs.outputFileSync(f, html);
  });
}

process.chdir(__dirname);
waterfall([
  listAll,
  listFromArgv,
  fix,
  listImages,
  copyImages,
  buildAll
]).catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
