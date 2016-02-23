"use strict";

module.exports = function (grunt) {
  var taskName = "articles";
  var taskDescription = "Build articles cache.";

  grunt.registerTask(taskName, taskDescription, function () {
    var fs = require("fs-extra");
    var path = require("path");

    var articles = [];
    var cache = path.relative(
      process.cwd(),
      path.join(__dirname, "cache", "articles.json")
    );
    var data = "src/weblog/plugins/state/files_index.dat";
    var fileNew = grunt.option("file");
    var force = grunt.option("force");
    var loadArticle = function (file, date) {
      return {
        title: fs.readFileSync(file, "utf8").split(/\n/)[0],
        link: "/blog/" + path.dirname(file).split(path.sep).pop() + "/" +
          path.basename(file, ".txt") + ".html",
        unixtime: date.getTime(),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
        tz: "+09:00"
      };
    };

    if (grunt.option("update")) {
      grunt.log.writeln("Cache generation skipped.");

      return;
    }

    if (!force && !fileNew) {
      grunt.fail.warn("`--file` option not found.");

      return;
    }

    if (!force) {
      articles = fs.readJsonSync(cache);
    }

    fs.readFileSync(data, "utf8").split(/\r?\n/).forEach(function (line) {
      if (!/\d+$/.test(line)) {
        return;
      }

      if (
        !force &&
        fileNew &&
        line.indexOf(fileNew) < 0
      ) {
        return;
      }

      line = line.split("=>");
      articles.unshift(loadArticle(
        path.relative(process.cwd(), line[0]),
        new Date(parseInt(line[1], 10) * 1000)
      ));
    });
    articles.sort(function (a, b) {
      return parseInt(a.unixtime, 10) - parseInt(b.unixtime, 10);
    }).reverse();
    fs.writeJsonSync(cache, articles);
    grunt.log.writeln('Cache "' + cache + '" created.');
  });
};
