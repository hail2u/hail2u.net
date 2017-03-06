#!/usr/bin/env node

"use strict";

const execFileSync = require("child_process").execFileSync;
const fs = require("fs");
const minify = require("../lib/html-minifier");
const minimist = require("minimist");
const mkdirp = require("mkdirp").sync;
const path = require("path");
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
const files = [];
const index = "../src/weblog/plugins/state/files_index.dat";
const perl = which("perl");

process.chdir(__dirname);

if (argv.all) {
  fs.readFileSync(index, "utf8")
    .split(/\r?\n/)
    .forEach((f) => {
      if (f === "") {
        return;
      }

      files.push(path.relative(dir.data, f.split("=>").shift()));
    });
}

if (argv.file) {
  const images = fs.readFileSync(argv.file, "utf8").match(/\bsrc="\/images\/blog\/.*?"/g);

  argv.file = path.relative(dir.data, argv.file);
  files.push(argv.file);
  files.push("index.rss");

  if (images) {
    images.map((i) => {
      return path.basename(i.split(/"/)[1]);
    }).forEach((i) => {
      fs.createReadStream(path.join(dir.img, i))
        .pipe(fs.createWriteStream(path.join(dir.staticimg, i)));
    });
  }
}

files.map((f) => {
  return f.replace(/\.txt$/, ".html").replace(/\\/g, "/");
}).forEach((f) => {
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
  mkdirp(path.dirname(f));
  fs.writeFileSync(f, html);
});
