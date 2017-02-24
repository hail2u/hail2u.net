#!/usr/bin/env node

"use strict";

const each = require("async").eachLimit;
const ensureAsync = require("async").ensureAsync;
const execFile = require("child_process").execFile;
const fs = require("fs-extra");
const minifyHTML = require("../lib/html-minifier");
const minimist = require("minimist");
const os = require("os");
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

let limit = os.cpus().length - 1;

function build(file, next) {
  let args = ["blosxom.cgi", `path=/${file}`];

  if (file === "index.rss") {
    file = "feed";
  }

  if (argv.reindex) {
    args = args.concat("reindex=1");
    argv.reindex = false;
  }

  execFile(perl, args, {
    cwd: dir.root,
    env: {
      BLOSXOM_CONFIG_DIR: path.resolve(dir.root)
    }
  }, (e, o) => {
    if (e) {
      return next(e);
    }

    o = `${o.replace(/^[\s\S]*?\r?\n\r?\n/, "").trim()}\n`;

    if (file.endsWith(".html")) {
      o = o.replace(/\b(href|src)(=")(https?:\/\/hail2u\.net\/)/g, "$1$2/");
      o = minifyHTML(o);
    }

    fs.outputFileSync(path.join(dir.static, file), o);
    next();
  });
}

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

if (argv.reindex) {
  limit = 1;
}

each(files.map((f) => {
  return f.replace(/\.txt$/, ".html").replace(/\\/g, "/");
}), limit, ensureAsync(build), (e) => {
  if (e) {
    throw e;
  }
});
