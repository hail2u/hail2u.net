#!/usr/bin/env node

"use strict";

const each = require("async").eachLimit;
const ensureAsync = require("async").ensureAsync;
const execFile = require("child_process").execFile;
const fs = require("fs-extra");
const minifyHTML = require("html-minifier").minify;
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
const data = path.resolve(__dirname, "../src/weblog/plugins/state/files_index.dat");
const dir = {
  data: "../src/weblog/entries/",
  img: "../src/img/blog/",
  root: "../src/weblog/",
  static: "../dist/blog/",
  staticimg: "../dist/images/blog/"
};
const perl = which("perl");

let limit = os.cpus().length - 1;
let files = [];
let images = [];

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
      BLOSXOM_CONFIG_DIR: dir.root
    }
  }, (e, o) => {
    if (e) {
      return next(e);
    }

    const entry = path.join(dir.static, file);
    let contents = `${o.replace(/^[\s\S]*?\r?\n\r?\n/, "").trim()}\n`;

    if (file.endsWith(".html")) {
      contents = contents.replace(/\b(href|src)(=")(https?:\/\/hail2u\.net\/)/g, "$1$2/");
      contents = minifyHTML(contents, {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeEmptyElements: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        sortAttributes: true,
        sortClassName: true,
        useShortDoctype: true
      });
    }

    fs.outputFileSync(entry, contents);
    next();
  });
}

for (const d in dir) {
  dir[d] = path.resolve(__dirname, dir[d]);
}

if (argv.file) {
  images = fs.readFileSync(argv.file, "utf8").match(/\bsrc="\/images\/blog\/.*?"/g);
  argv.file = path.relative(dir.data, argv.file);
  files.push(argv.file);
  files.push("index.rss");
  limit = 1;

  if (images) {
    images.map((i) => {
      return path.basename(i.split(/"/)[1]);
    }).forEach((i) => {
      fs.createReadStream(path.join(dir.img, i))
        .pipe(fs.createWriteStream(path.join(dir.staticimg, i)));
    });
  }
}

if (argv.all) {
  fs.readFileSync(data, "utf8")
    .split(/\r?\n/)
    .forEach((f) => {
      if (f === "") {
        return;
      }

      files.push(path.relative(dir.data, f.split("=>").shift()));
    });
}

files = files.map((f) => {
  return f.replace(/\.txt$/, ".html").replace(/\\/g, "/");
});
each(files, limit, ensureAsync(build), (e) => {
  if (e) {
    throw e;
  }
});
