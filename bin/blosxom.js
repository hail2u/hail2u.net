#!/usr/bin/env node

"use strict";

var ProgressBar = require("progress");
var async = require("async");
var fs = require("fs-extra");
var minifyHTML = require("html-minifier").minify;
var minimist = require("minimist");
var os = require("os");
var path = require("path");
var spawn = require("child_process").spawnSync;
var which = require("which").sync;

var argv = minimist(process.argv.slice(2), {
  boolean: [
    "all",
    "index",
    "update"
  ],
  string: ["file"]
});
var bar;
var cpuNum = os.cpus().length;
var d;
var data = "../src/weblog/plugins/state/files_index.dat";
var dir = {
  data: "../src/weblog/entries/",
  img: "../src/img/blog/",
  root: "../src/weblog/",
  static: "../dist/blog/",
  staticimg: "../dist/images/blog/"
};
var files = [];
var images = [];
var reindexed = false;

for (d in dir) {
  dir[d] = path.resolve(__dirname, dir[d]);
}

if (argv.file) {
  images = fs.readFileSync(
    argv.file,
    "utf8"
  ).match(/\bsrc="\/images\/blog\/.*?"/g);
  argv.file = path.relative(dir.data, argv.file);
  files.push(argv.file);
  files.push(path.join(path.dirname(argv.file), "index.html"));
  files.push("index.rss");
  cpuNum = 1;

  if (images) {
    images.forEach(function (image) {
      var dest;
      var src;

      image = image.replace(/^src="\/images\/blog\/(.*?)"$/, "$1");
      src = path.join(dir.img, image);
      dest = path.join(dir.staticimg, image);
      fs.copySync(src, dest);
    });
  }
}

if (argv.all && files.join() === "") {
  fs.readFileSync(
    path.resolve(__dirname, data),
    "utf8"
  ).split(/\r?\n/).forEach(function (file) {
    if (file === "") {
      return;
    }

    files.push(path.relative(dir.data, file.split("=>").shift()));
  });
}

if (argv.index) {
  fs.readdirSync(dir.data).forEach(function (file) {
    if (!fs.statSync(file).isDirectory()) {
      return;
    }

    if (file === "themes") {
      return;
    }

    files.push(path.join(file, "index.html"));
  });
}

files = files.map(function (file) {
  return file.replace(/\.txt$/, ".html").replace(/\\/g, "/");
});
bar = new ProgressBar("Building [:bar] :percent :elapsed", {
  total: files.length,
  width: 32
});

async.eachLimit(files, cpuNum, async.ensureAsync(function (file, next) {
  var args = ["blosxom.cgi", "path=/" + file];
  var contents;
  var perl;

  if (!argv.update && !reindexed) {
    args = args.concat("reindex=1");
    reindexed = true;
  }

  perl = spawn(
    which("perl"),
    args,
    {
      cwd: dir.root,
      encoding: "utf8",
      env: {
        BLOSXOM_CONFIG_DIR: dir.root
      }
    }
  );

  if (perl.error) {
    return next(perl.error);
  }

  contents = perl.stdout.replace(
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

  file = path.join(dir.static, file);
  fs.outputFileSync(file, contents);
  bar.tick();
  next();
}), function (error) {
  if (error) {
    throw error;
  }
});
