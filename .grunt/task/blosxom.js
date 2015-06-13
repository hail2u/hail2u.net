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
    var num = 1;
    var options = this.options({
      all: false,
      feed: false,
      index: false,
      perl: "perl",
      reindex: false
    });
    fileCache = path.resolve(options.rootdir, "plugins/state/files_index.dat");

    if (options.feed) {
      files.push("index.rss");
    }

    if (options.reindex) {
      args.push("reindex=1");
    }

    if (options.all) {
      fs.readdirSync(options.datadir).forEach(function (dir) {
        if (dir === "themes") {
          return;
        }

        files.push(dir + "\\index.html");
      });

      if (!options.index) {
        fs.readFileSync(
          fileCache,
          "utf8"
        ).split(/\r?\n/).forEach(function (file) {
          if (file === "") {
            return;
          }

          file = path.relative(options.datadir, file.split("=>")[0]);
          files.push(file);
        });
      }

      bar = new ProgressBar("Rebuilding [:bar] :percent :elapsed", {
        total: files.length,
        width: 32
      });
    } else if (entry) {
      var i = 0;
      var images = fs.readFileSync(entry, "utf-8").match(/\bsrc="\/images\/blog\/.*?"/g);
      var n = "image";

      if (path.resolve(entry) === path.normalize(entry)) {
        entry = path.relative(options.datadir, entry);
        files.unshift(entry);
      }

      if (options.index) {
        entry = path.join(path.dirname(entry), "index.html");
        files.push(entry);
      }

      if (images) {
        images.forEach(function (image) {
          var dest;
          var src;
          image = image.replace(/^src="\/images\/blog\/(.*?)"$/, "$1");
          src = options.imgdir + image;
          dest = options.staticimgdir + image;

          if (fs.statSync(src).isFile()) {
            fs.copySync(src, dest);
            i++;
            grunt.verbose.writeln("Image \"" + src + "\" copied to \"" + dest + "\".");
          }
        });

        if (i > 1) {
          n += "s";
        }

        grunt.log.writeln(i + " " + n + " copied.");
      } else {
        grunt.log.writeln("Image not found.");
      }
    }

    files = files.map(function (file) {
      return file.replace(/\.txt$/, ".html").replace(/\\/g, "/");
    });

    if (files.length > 8) {
      num = 8;
    }

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

      if (num === 1 && args.length === 2) {
        args.pop();
      }

      next();
    }, function (error) {
      done(error);
    });
  });
};
