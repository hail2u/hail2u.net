"use strict";

module.exports = function (grunt) {
  var taskDescription = "Generate Blosxom files.";
  var taskName = "blosxom";

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var ProgressBar = require("progress");
    var async = require("async");
    var fs = require("fs-extra");
    var path = require("path");
    var spawn = require("child_process").spawnSync;
    var which = require("which").sync;

    var args = ["blosxom.cgi"];
    var bar;
    var done = this.async();
    var entry = grunt.option("file");
    var fileCache;
    var files = [];
    var images = [];
    var num = 1;
    var options = this.options({
      all: false,
      feed: false,
      index: false,
      perl: "perl",
      reindex: false
    });
    fileCache = path.resolve(options.rootdir, "plugins/state/files_index.dat");

    if (options.reindex) {
      args.push("reindex=1");
    }

    if (options.feed) {
      files.push("index.rss");
    }

    if (options.index) {
      fs.readdirSync(options.datadir).forEach(function (dir) {
        if (dir === "themes") {
          return;
        }

        files.push(dir + path.sep + "index.html");
      });
    }

    if (options.all) {
      num = 8;
      fs.readFileSync(
        fileCache,
        "utf8"
      ).split(/\r?\n/).forEach(function (file) {
        if (file === "") {
          return;
        }

        files.push(path.relative(options.datadir, file.split("=>")[0]));
      });
      bar = new ProgressBar("Rebuilding [:bar] :percent :elapsed", {
        total: files.length,
        width: 32
      });
    } else if (entry) {
      images = fs.readFileSync(
        entry,
        "utf-8"
      ).match(/\bsrc="\/images\/blog\/.*?"/g);
      entry = path.relative(options.datadir, entry);
      files.unshift(entry);
      files.push(path.join(path.dirname(entry), "index.html"));

      if (images) {
        images.forEach(function (image) {
          var dest;
          var src;
          image = image.replace(/^src="\/images\/blog\/(.*?)"$/, "$1");
          src = options.imgdir + image;
          dest = options.staticimgdir + image;

          try {
            fs.copySync(src, dest);
            grunt.verbose.writeln("Image \"" + src + "\" copied to \"" + dest + "\".");
          } catch (e) {
            throw e;
          }
        });
        grunt.log.write(images.length + " image");

        if (images.length > 1) {
          grunt.log.write("s");
        }

        grunt.log.writeln(" copied.");
      } else {
        grunt.log.writeln("Image not found.");
      }
    }

    files = files.map(function (file) {
      return file.replace(/\.txt$/, ".html").replace(/\\/g, "/");
    });

    async.eachLimit(files, num, function (file, next) {
      var child = spawn(
        which(options.perl),
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
      }

      file = options.staticdir + file;
      fs.outputFileSync(file, contents);

      if (bar) {
        bar.tick();
      } else {
        grunt.log.writeln("File \"" + file + "\" created.");
      }

      if (options.reindex && args.length > 1) {
        args.pop();
      }

      next();
      async.setImmediate(function () {
        next();
      });
    }, function (error) {
      done(error);
    });
  });
};
