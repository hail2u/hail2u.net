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
const perl = which("perl");

let limit = os.cpus().length - 1;
let d;
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
  }, function (err, stdout) {
    const entry = path.join(dir.static, file);

    let contents;

    if (err) {
      return next(err);
    }

    contents = `${
      stdout.replace(/^[\s\S]*?\r?\n\r?\n/, "").trim()
    }\n`;

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

    fs.outputFileSync(entry, contents);
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
  limit = 1;

  if (images) {
    images.forEach(function (image) {
      image = image.replace(/^src="\/images\/blog\/(.*?)"$/, "$1");
      fs.createReadStream(
        path.join(dir.img, image)
      ).pipe(fs.createWriteStream(
        path.join(dir.staticimg, image)
      ));
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
each(files, limit, ensureAsync(build), function (err) {
  if (err) {
    throw err;
  }
});
