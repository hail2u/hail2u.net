#!/usr/bin/env node

"use strict";

const eachSeries = require("async").eachSeries;
const ensureAsync = require("async").ensureAsync;
const execFile = require("child_process").execFile;
const fs = require("fs");
const minifyHTML = require("html-minifier").minify;
const minimist = require("minimist");
const mkdirp = require("mkdirp");
const path = require("path");

const argv = minimist(process.argv.slice(2), {
  boolean: [
    "all",
    "reindex"
  ],
  string: ["file"]
});
const data = path.resolve(
  __dirname,
  "../src/weblog/plugins/state/files_index.dat"
);
const dir = {
  data: "../src/weblog/entries/",
  img: "../src/img/blog/",
  root: "../src/weblog/",
  static: "../dist/blog/",
  staticimg: "../dist/images/blog/"
};
let each = require("async").each;
const perl = "perl";

let d;
let files = [];
let images = [];

function build(file, next) {
  let args = ["blosxom.cgi", "path=/" + file];

  if (argv.reindex) {
    args = args.concat("reindex=1");
    argv.reindex = false;
  }

  execFile(perl, args, {
    cwd: dir.root,
    env: {
      BLOSXOM_CONFIG_DIR: dir.root
    }
  }, function (err, stdout) {
    let entry;
    let contents;

    if (err) {
      return next(err);
    }

    contents = stdout.replace(
      /^[\s\S]*?\r?\n\r?\n/,
      ""
    ).trim() + "\n";

    if (file === "index.rss") {
      file = "feed";
    }

    if (file.endsWith(".html")) {
      contents = contents.replace(
        /\b(href|src)(=")(https?:\/\/hail2u\.net\/)/g,
        "$1$2/"
      );
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

    entry = path.join(dir.static, file);
    mkdirp.sync(path.dirname(entry));
    fs.writeFileSync(entry, contents);
    next();
  });
}

for (d in dir) {
  dir[d] = path.resolve(__dirname, dir[d]);
}

if (argv.file) {
  images = fs.readFileSync(
    argv.file,
    "utf8"
  ).match(
    /\bsrc="\/images\/blog\/.*?"/g
  );
  argv.file = path.relative(dir.data, argv.file);
  files.push(argv.file);
  files.push("index.rss");
  each = eachSeries;

  if (images) {
    images.forEach(function (image) {
      let dest;
      let src;

      image = image.replace(/^src="\/images\/blog\/(.*?)"$/, "$1");
      src = path.join(dir.img, image);
      dest = path.join(dir.staticimg, image);
      fs.createReadStream(src).pipe(fs.createWriteStream(dest));
    });
  }
}

if (argv.all) {
  fs.readFileSync(data, "utf8").split(/\r?\n/).forEach(function (file) {
    if (file === "") {
      return;
    }

    files.push(path.relative(dir.data, file.split("=>").shift()));
  });
}

files = files.map(function (file) {
  return file.replace(/\.txt$/, ".html").replace(/\\/g, "/");
});
each(files, ensureAsync(build), function (err) {
  if (err) {
    throw err;
  }
});
