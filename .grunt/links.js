"use strict";

module.exports = function (grunt) {
  var taskName = "bookmarks";
  var taskDescription = "Build bookmarks cache.";

  grunt.registerTask(taskName, taskDescription, function () {
    var fs = require("fs-extra");
    var path = require("path");
    var pit = require("pit-ro");
    var request = require("request");

    var cache = path.relative(
      process.cwd(),
      path.join(__dirname, "cache", "bookmarks.json")
    );
    var config = pit.get("pinboard.in");
    var done = this.async();
    var force = grunt.option("force");
    var bookmarks = [];
    var qs = {
      format: "json"
    };

    if (!force) {
      bookmarks = fs.readJsonSync(cache);
      qs.fromdt = bookmarks[0].time;
    }

    qs.auth_token = config.username + ":" + config.token;
    request.get({
      qs: qs,
      uri: "https://api.pinboard.in/v1/posts/all"
    }, function (error, response, body) {
      var code = response.statusCode;
      var newBookmarks;

      if (error) {
        return done(error);
      }

      if (code !== 200) {
        grunt.log.writeln("Pinboard API server returned " + code + ".");

        return done(new Error(response.statusMessage));
      }

      newBookmarks = JSON.parse(body).filter(function (link) {
        if (link.toread === "yes") {
          return false;
        }

        return true;
      });

      if (newBookmarks.length === 0) {
        grunt.log.writeln("No new bookmarks found.");

        return done();
      }

      if (force) {
        bookmarks = newBookmarks.slice(0);
        newBookmarks = [];
        grunt.log.writeln('Cache "' + cache + '" rebuilt.');
      }

      newBookmarks.reverse().forEach(function (link) {
        bookmarks.unshift(link);
        grunt.log.writeln('Bookmark "' + link.href + '" added.');
      });

      fs.writeJsonSync(cache, bookmarks);
      grunt.log.writeln('Cache "' + cache + '" created.');
      done();
    });
  });
};
