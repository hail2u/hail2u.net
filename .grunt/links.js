"use strict";

module.exports = function (grunt) {
  var taskName = "links";
  var taskDescription = "Build links cache.";

  grunt.registerTask(taskName, taskDescription, function () {
    var fs = require("fs-extra");
    var path = require("path");
    var pit = require("pit-ro");
    var request = require("request");

    var cache = path.relative(
      process.cwd(),
      path.join(__dirname, "cache", "links.json")
    );
    var config = pit.get("pinboard.in");
    var done = this.async();
    var force = grunt.option("force");
    var links = [];
    var qs = {
      format: "json"
    };

    if (!force) {
      links = fs.readJsonSync(cache);
      qs.fromdt = links[0].time;
    }

    qs.auth_token = config.username + ":" + config.token;
    request.get({
      qs: qs,
      uri: "https://api.pinboard.in/v1/posts/all"
    }, function (error, response, body) {
      var code = response.statusCode;
      var newLinks;

      if (error) {
        return done(error);
      }

      if (code !== 200) {
        grunt.log.warn("Pinboard API server returned " + code + ".");

        return done(new Error(response.statusMessage));
      }

      newLinks = JSON.parse(body).filter(function (link) {
        if (link.toread === "yes") {
          return false;
        }

        return true;
      });

      if (force) {
        links = newLinks.slice(0);
        newLinks = [];
      }

      if (!force && newLinks.length === 0) {
        grunt.log.writeln("No new bookmarks found.");

        return done();
      }

      newLinks.reverse().forEach(function (link) {
        links.unshift(link);
        grunt.log.writeln('New bookmark "' + link.href + '" is added.');
      });

      fs.writeJsonSync(cache, links);
      grunt.log.writeln('Cache "' + cache + '" is rebuilt.');
      return done();
    });
  });
};
