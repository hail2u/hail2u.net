#!/usr/bin/env node

"use strict";

const ProgressBar = require("progress");
const eachLimit = require("async").eachLimit;
const ensureAsync = require("async").ensureAsync;
const execFile = require("child_process").execFile;
const fs = require("fs");
const minifyHTML = require("html-minifier").minify;
const minimist = require("minimist");
const mkdirp = require("mkdirp");
const os = require("os");
const path = require("path");
const which = require("which").sync;

const config = {
  data: "../src/weblog/plugins/state/files_index.dat",
  dir: {
    data: "../src/weblog/entries/",
    img: "../src/img/blog/",
    root: "../src/weblog/",
    static: "../dist/blog/",
    staticimg: "../dist/images/blog/"
  }
};

var argv = minimist(process.argv.slice(2), {
  boolean: [
    "all",
    "reindex"
  ],
  string: ["file"]
});
var bar;
var cpuNum = Math.max(1, os.cpus().length - 1);
var d;
var files = [];
var images = [];

function build(file, next) {
  var args = ["blosxom.cgi", "path=/" + file];

  if (argv.reindex) {
    args = args.concat("reindex=1");
    argv.reindex = false;
  }

  execFile(which("perl"), args, {
    cwd: config.dir.root,
    env: {
      BLOSXOM_CONFIG_DIR: config.dir.root
    }
  }, function (err, stdout) {
    var entry;
    var contents;

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

    entry = path.join(config.dir.static, file);
    mkdirp.sync(path.dirname(entry));
    fs.writeFileSync(entry, contents);
    bar.tick();
    next();
  });
}

config.data = path.resolve(__dirname, config.data);

for (d in config.dir) {
  config.dir[d] = path.resolve(__dirname, config.dir[d]);
}

if (argv.file) {
  images = fs.readFileSync(
    argv.file,
    "utf8"
  ).match(
    /\bsrc="\/images\/blog\/.*?"/g
  );
  argv.file = path.relative(config.dir.data, argv.file);
  files.push(argv.file);
  files.push("index.rss");
  cpuNum = 1;

  if (images) {
    images.forEach(function (image) {
      var dest;
      var src;

      image = image.replace(/^src="\/images\/blog\/(.*?)"$/, "$1");
      src = path.join(config.dir.img, image);
      dest = path.join(config.dir.staticimg, image);
      fs.createReadStream(src).pipe(fs.createWriteStream(dest));
    });
  }
}

if (argv.all) {
  fs.readFileSync(config.data, "utf8").split(/\r?\n/).forEach(function (file) {
    if (file === "") {
      return;
    }

    files.push(path.relative(config.dir.data, file.split("=>").shift()));
  });
}

files = files.map(function (file) {
  return file.replace(/\.txt$/, ".html").replace(/\\/g, "/");
});
bar = new ProgressBar("Building [:bar] :percent :elapsed", {
  total: files.length,
  width: 25
});
bar.render();
eachLimit(files, cpuNum, ensureAsync(build), function (err) {
  if (err) {
    throw err;
  }
});
