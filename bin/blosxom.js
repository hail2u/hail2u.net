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

var args = ["blosxom.cgi"];
var argv = minimist(process.argv.slice(2), {
  boolean: [
    "all",
    "index"
  ],
  string: ["file"]
});
var bar;
var cache = "src/weblog/plugins/state/files_index.dat";
var entry = argv.file;
var files = [];
var images = [];
var num = os.cpus().length;
var options = {
  datadir: "src/weblog/entries/",
  imgdir: "src/img/blog/",
  rootdir: "src/weblog/",
  staticdir: "dist/blog/",
  staticimgdir: "dist/images/blog/"
};

if (entry) {
  images = fs.readFileSync(
    entry,
    "utf-8"
  ).match(/\bsrc="\/images\/blog\/.*?"/g);
  entry = path.relative(options.datadir, entry);
  files.push(entry);
  files.push(path.join(path.dirname(entry), "index.html"));
  files.push("index.rss");
  args.push("reindex=1");
  num = 1;

  if (images) {
    images.forEach(function (image) {
      var dest;
      var src;
      image = image.replace(/^src="\/images\/blog\/(.*?)"$/, "$1");
      src = options.imgdir + image;
      dest = options.staticimgdir + image;

      try {
        fs.copySync(src, dest);
      } catch (e) {
        throw e;
      }
    });
  }
}

if (argv.all && files.length === 0) {
  fs.readFileSync(
    cache,
    "utf8"
  ).split(/\r?\n/).forEach(function (file) {
    if (file === "") {
      return;
    }

    files.push(path.relative(options.datadir, file.split("=>")[0]));
  });
}

if (argv.index) {
  fs.readdirSync(options.datadir).forEach(function (dir) {
    if (dir === "themes") {
      return;
    }

    files.push(dir + path.sep + "index.html");
  });
}

bar = new ProgressBar("Building [:bar] :percent :elapsed", {
  total: files.length,
  width: 32
});
files = files.map(function (file) {
  return file.replace(/\.txt$/, ".html").replace(/\\/g, "/");
});

async.eachLimit(files, num, function (file, next) {
  var child = spawn(
    which("perl"),
    args.concat("path=/" + file), {
      cwd: options.rootdir,
      encoding: "utf8",
      env: {
        BLOSXOM_CONFIG_DIR: path.resolve(options.rootdir)
      }
    }
  );
  var contents;

  if (child.error) {
    return next(child.error);
  }

  contents = child.stdout.replace(
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
      collapseInlineTagWhitespace: true,
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

  file = options.staticdir + file;
  fs.outputFileSync(file, contents);
  bar.tick();

  if (entry && args.length > 1) {
    args.pop();
  }

  async.setImmediate(function () {
    next();
  });
}, function (error) {
  if (error) {
    throw error;
  }
});
