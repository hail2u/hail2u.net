"use strict";

module.exports = function (grunt) {
  var taskName = "generate";
  var taskDescription = "Generate files.";

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var async = require("async");
    var fs = require("fs-extra");
    var hbs = require("handlebars");
    var parseXML = require("xml2js").parseString;
    var path = require("path");
    var sprintf = require("sprintf").sprintf;

    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
      "Sep", "Oct", "Nov", "Dec"];
    var categoryNames = {
      "Blog": "blog",
      "Blosxom": "blosxom",
      "Coding": "coding",
      "Gadget": "gadget",
      "Game": "game",
      "Internet": "internet",
      "Media": "media",
      "Miscellaneous": "misc",
      "RSS": "rss",
      "Software": "software",
      "Sports": "sports",
      "Web Design": "webdesign"
    };
    var invCategoryNames = (function (obj) {
      var newObj = {};

      for (var prop in obj) {
        newObj[obj[prop]] = prop;
      }

      return newObj;
    })(categoryNames);

    var done = this.async();
    var dirTemplate = this.data.cwd;
    var metadataBase = JSON.parse(
      fs.readFileSync(dirTemplate + "metadata.json", "utf8")
    );
    var dirPartial = path.join(dirTemplate, "partial");
    fs.readdirSync(dirPartial).forEach(function (partial) {
      hbs.registerPartial(
        path.basename(partial, ".mustache"),
        fs.readFileSync(path.join(dirPartial, partial), "utf8")
      );
    });

    var extendObject = function (dest, src) {
      if (dest !== Object(dest)) {
        return dest;
      }

      for (var prop in src) {
        dest[prop] = src[prop];
      }

      return dest;
    };

    var loadRSS = function (file) {
      var feed = {};

      parseXML(fs.readFileSync(file, "utf8"), {
        trim: true,
        explicitArray: false
      }, function (error, data) {
        if (error) {
          grunt.fail.warn(error);
        }

        feed = data.rss.channel;
      });

      feed.item.forEach(function (val) {
        if (val.link) {
          val.link = val.link.replace("http://hail2u.net/", "/");
        }

        if (val.pubDate) {
          var date = new Date(val.pubDate);
          var yy = date.getFullYear();
          var mm = date.getMonth();
          var dd = date.getDate();
          var hh = date.getHours();
          var nn = date.getMinutes();
          var ss = date.getSeconds();
          val.strPubDate = monthNames[mm] + " " + dd + ", " + yy;
          val.html5PubDate = sprintf(
            "%04d-%02d-%02dT%02d:%02d:%02d+09:00",
            yy, mm + 1, dd, hh, nn, ss
          );
        }

        if (val.category) {
          val.cat = categoryNames[val.category];
        }
      });

      return feed;
    };

    var loadArticles = function (data) {
      var cache = path.relative(
        process.cwd(),
        path.join(__dirname, "../cache", "articles.json")
      );
      var articles = JSON.parse(fs.readFileSync(cache, "utf8"));
      var fileNew = path.basename(grunt.option("file"));

      if (grunt.cli.tasks[0] === "publish:blog" && fileNew) {
        fs.readFileSync(data, "utf8").split(/\r?\n/).forEach(function (line) {
          if (!/\d+$/.test(line) || line.indexOf(fileNew) < 0) {
            return;
          }

          line = line.split("=>");
          var file = path.relative(process.cwd(), line[0]);
          var category = path.dirname(file).split(path.sep).pop();
          var fn = path.basename(file, ".txt");
          var date = new Date(parseInt(line[1], 10) * 1000);
          var yy = date.getFullYear();
          var mm = date.getMonth();
          var dd = date.getDate();
          var hh = date.getHours();
          var nn = date.getMinutes();
          var ss = date.getSeconds();
          var article = {
            title: fs.readFileSync(file, "utf8").split(/\n/)[0],
            link: "/blog/" + category + "/" + fn + ".html",
            unixtime: date.getTime(),
            year: yy,
            month: mm + 1,
            day: dd,
            hour: hh,
            minute: nn,
            second: ss,
            tz: "+09:00"
          };
          articles.unshift(article);
          articles.sort(function (a, b) {
            return parseInt(a.unixtime, 10) - parseInt(b.unixtime, 10);
          }).reverse();
          fs.outputFileSync(cache, JSON.stringify(articles, null, 2));
          grunt.log.writeln("File \"" + cache.replace(/\\/g, "/") +
            "\" updated.");
        });
      }

      articles.forEach(function (article, i, a) {
        article.cat = article.link.replace(/^\/blog\/(.*?)\/.*$/, '$1');
        article.category = invCategoryNames[article.cat];
        article.strPubDate = monthNames[article.month - 1] + " " + article.day;
        article.html5PubDate = sprintf(
          "%04d-%02d-%02dT%02d:%02d:%02d+09:00",
          article.year, article.month, article.day, article.hour,
          article.minute, article.second
        );

        if (i > 0 && this.y !== article.year) {
          article.isFirstInYear = true;
          a[i - 1].isLastInYear = true;
        }

        if (i === 0) {
          article.isFirstInYear = true;
        }

        if (i === a.length - 1) {
          article.isLastInYear = true;
        }

        this.y = article.year;
      }, {
        y: true
      });

      return articles;
    };

    var extendData = function (file) {
      var data = extendObject({}, metadataBase);
      var fileMetadata = file.replace(/\.\w+$/, ".json");

      if (fs.existsSync(fileMetadata) && fs.statSync(fileMetadata).isFile()) {
        extendObject(data, JSON.parse(fs.readFileSync(fileMetadata, "utf8")));
      }

      switch (file) {
        case "src/html/index.mustache": {
          data.updates = loadRSS("src/feed/index.rss");
          data.updates.item = data.updates.item.slice(0, 5);
          data.articles = loadRSS("build/blog/feed");
          data.articles.item = data.articles.item.slice(0, 6);
          data.articles.first = data.articles.item.shift();
          var imgs = data.articles.first["content:encoded"].match(/<img.*?>/g);

          if (imgs) {
            var img = imgs[0].replace(/src="http:\/\/hail2u\.net/, "src=\"");
            data.articles.first.image = img;
            data.articles.first.hasImage = true;
          }

          break;
        }

        case "src/html/blog/index.mustache": {
          data.articles = loadArticles(
            "src/weblog/plugins/state/files_index.dat"
          );

          break;
        }
      }

      return data;
    };

    async.each(this.files, function (file, next) {
      var fileTemplate = file.src[0];

      if (!fs.existsSync(fileTemplate)) {
        grunt.log.warn("Source file \"" + fileTemplate + "\" not found.");

        return next();
      }

      dirTemplate = path.dirname(fileTemplate);
      var metadata = extendData(fileTemplate);
      var template = fs.readFileSync(fileTemplate, "utf8");
      var render = hbs.compile(template);
      fs.outputFileSync(file.dest, render(metadata));
      grunt.log.writeln("File \"" + file.dest + "\" created.");
      next();
    }, function (error) {
      done(error);
    });
  });
};
