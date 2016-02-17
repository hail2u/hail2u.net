"use strict";

module.exports = function (grunt) {
  var taskName = "links";
  var taskDescription = "Gather links.";

  grunt.registerTask(taskName, taskDescription, function () {
    var fs = require("fs-extra");
    var hbs = require("handlebars");
    var pit = require("pit-ro");
    var request = require("request");

    var config = pit.get("pinboard.in");
    var d = {
      item: []
    };
    var dest = "dist/links/index.html";
    var done = this.async();
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
      "Sep", "Oct", "Nov", "Dec"];
    var data = "src/links/index.json";
    var force = grunt.option("force");
    var qs = {
      format: "json"
    };
    var tmpl = "src/links/index.mustache";
    var url = "https://api.pinboard.in/v1/posts/all";

    if (!force) {
      d = fs.readJsonSync(data);
      qs.fromdt = d.item[0].time;
    }

    qs.auth_token = config.username + ":" + config.token;
    request.get({
      qs: qs,
      uri: url
    }, function (error, response, body) {
      var newData;
      var template;

      if (error) {
        return done(error);
      }

      if (response.statusCode !== 200) {
        grunt.log.writeln("Pinboard API server returned an error. (" +
          response.statusCode + ")");
        return done(new Error(response.statusMessage));
      }

      newData = JSON.parse(body).filter(function (item) {
        if (item.toread === "yes") {
          return false;
        }

        return true;
      });

      if (force) {
        d.item = newData.slice(0);
        newData = [];
        grunt.log.writeln('Cache file "' + data + '" is rebuilt.');
      }

      if (!force && newData.length === 0) {
        grunt.log.writeln("No new bookmarks found.");
        return done();
      }

      newData.reverse().forEach(function (item) {
        grunt.log.writeln('New bookmark "' + item.href + '" is added.');
        d.item.unshift(item);
      });
      fs.writeJsonSync(data, d);
      d.item.forEach(function (item, i, a) {
        var category = item.tags;
        var date = new Date(item.time);
        var year = date.getFullYear();

        if (category.indexOf("github") > 0) {
          category = "GitHub";
        } else if (category.indexOf("instagram") > 0) {
          category = "Instagram";
        } else if (category.indexOf("instapaper") > 0) {
          category = "Instapaper";
        } else if (category.indexOf("pinterest") > 0) {
          category = "Pinterest";
        } else if (category.indexOf("soundcloud") > 0) {
          category = "Soundcloud";
        } else if (category.indexOf("vimeo") > 0) {
          category = "Vimeo";
        } else {
          category = "Pinboard";
        }

        item.category = category;
        item.date = monthNames[date.getMonth()] + " " + date.getDate();
        item.year = year;

        if (i > 0 && this.y !== year) {
          item.isFirstInYear = true;
          a[i - 1].isLastInYear = true;
        }

        if (i === 0) {
          item.isFirstInYear = true;
        }

        this.y = year;
      }, {
        y: 0
      });
      d.item[d.item.length - 1].isLastInYear = true;
      template = hbs.compile(fs.readFileSync(tmpl, "utf-8"));
      fs.outputFileSync(dest, template(d));
      grunt.log.writeln('File "' + dest + '" created.');
      return done()
    });
  });
};
