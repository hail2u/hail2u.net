"use strict";

module.exports = function (grunt) {
  var taskName = "generate";
  var taskDescription = "Generate files.";

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var async = require("async");
    var fs = require("fs-extra");
    var mustache = require("mustache");
    var parseXML = require("xml2js").parseString;
    var path = require("path");
    var sprintf = require("sprintf").sprintf;

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
    var categoryNamesInv = (function (obj) {
      var newObj = {};

      for (var prop in obj) {
        newObj[obj[prop]] = prop;
      }

      return newObj;
    })(categoryNames);
    var entityMap = {
      '"': "&quot;",
      "&": "&amp;",
      "'": "&#39;",
      "<": "&lt;",
      ">": "&gt;"
    };
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
      "Sep", "Oct", "Nov", "Dec"];
    var monthNamesFull = ["January", "February", "March", "April", "May",
      "June", "July", "August", "September", "October", "November", "December"];

    var done = this.async();
    var dirTemplate = this.data.cwd;
    var metadataBase = JSON.parse(
      fs.readFileSync(dirTemplate + "metadata.json", "utf8")
    );
    var dirPartial = path.join(dirTemplate, "partial");
    var partials = {};

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
          val.link = val.link.replace(/https?:\/\/hail2u\.net\//, "/");
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

    var loadArticles = function () {
      var cache = path.relative(
        process.cwd(),
        path.join(__dirname, "cache", "articles.json")
      );
      var articles = [];

      try {
        articles = JSON.parse(fs.readFileSync(cache, "utf8"));
      } catch (e) {
        grunt.log.writeln('Cache "' + cache + '" not found.');
      }

      articles.forEach(function (article, i, a) {
        article.cat = article.link.replace(/^\/blog\/(.*?)\/.*$/, "$1");
        article.category = categoryNamesInv[article.cat];
        article.strPubDate = monthNamesFull[article.month - 1] + " " +
          article.day;
        article.html5PubDate = sprintf(
          "%04d-%02d-%02dT%02d:%02d:%02d+09:00",
          article.year, article.month, article.day, article.hour,
          article.minute, article.second
        );

        if (i > 0 && this.y !== article.year) {
          article.isFirstInYear = true;
          a[i - 1].isLastInYear = true;
        }

        this.y = article.year;
      }, {
        y: true
      });
      articles[0].isFirstInYear = true;
      articles[articles.length - 1].isLastInYear = true;

      return articles;
    };

    var loadBookmarks = function () {
      var cache = path.relative(
        process.cwd(),
        path.join(__dirname, "cache", "bookmarks.json")
      );
      var bookmarks = [];

      try {
        bookmarks = fs.readJsonSync(cache);
      } catch (e) {
        grunt.log.writeln('Cache "' + cache + '" not found.');
      }

      bookmarks.forEach(function (bookmark, i, a) {
        var category = "other";
        var date = new Date(bookmark.time);
        var tags = bookmark.tags;
        var year = date.getFullYear();

        if (tags.indexOf("dribbble") !== -1) {
          category = "dribbble";
          bookmark.description = bookmark.description.replace(
            /^Dribbble - /,
            ""
          ).replace(
            / - Dribbble$/,
            ""
          );
        } else if (tags.indexOf("github") !== -1) {
          category = "github";
          bookmark.description = bookmark.extended.replace(
            /^hail2u starred /,
            ""
          );
        } else if (tags.indexOf("instagram") !== -1) {
          category = "instagram";
          bookmark.description = bookmark.href.replace(
            /^https:\/\/www\.instagram\.com\/p\//,
            ""
          ).replace(
            /\/$/,
            ""
          ).substr(0, 12);
        } else if (tags.indexOf("pinterest") !== -1) {
          category ="pinterest";
          bookmark.description = bookmark.extended;
        } else if (tags.indexOf("soundcloud") !== -1) {
          category = "soundcloud";
          bookmark.description = bookmark.extended;
        } else if (tags.indexOf("vimeo") !== -1) {
          category = "vimeo";
          bookmark.description = bookmark.description.replace(/ on Vimeo$/, "");
        } else if (bookmark.shared === "yes") {
          category = "pinboard";
        }

        bookmark.category = category;
        bookmark.date = monthNamesFull[date.getMonth()] + " " + date.getDate();
        bookmark.year = year;

        if (i > 0 && this.y !== year) {
          bookmark.isFirstInYear = true;
          a[i - 1].isLastInYear = true;
        }

        this.y = year;
      }, {
        y: 0
      });
      bookmarks[0].isFirstInYear = true;
      bookmarks[bookmarks.length - 1].isLastInYear = true;

      return bookmarks;
    };

    var extendData = function (file) {
      var data = extendObject({}, metadataBase);
      var fileMetadata = file.replace(/\.\w+$/, ".json");

      try {
        extendObject(data, JSON.parse(fs.readFileSync(fileMetadata, "utf8")));
      } catch (e) {
        grunt.log.writeln('Metadata file "' + fileMetadata + '" not found.');
      }

      switch (file) {
      case "src/html/index.mustache":
        data.updates = loadRSS("src/index.rss");
        data.updates.item = data.updates.item.slice(0, 5);
        data.articles = loadRSS("dist/blog/feed");
        data.articles.item = data.articles.item.slice(0, 6);
        data.articles.first = data.articles.item.shift();
        var imgs = data.articles.first["content:encoded"].match(/<img.*?>/g);

        if (imgs) {
          var img = imgs[0].replace(/src="https?:\/\/hail2u\.net/, 'src="');
          data.articles.first.image = img;
          data.articles.first.hasImage = true;
        }

        break;

      case "src/html/blog/index.mustache":
        data.articles = loadArticles();

        break;

      case "src/html/links/index.mustache":
        data.bookmarks = loadBookmarks();

        break;
      }

      return data;
    };

    mustache.escape = function (str) {
      return String(str).replace(/[&<>"']/g, function (s) {
        return entityMap[s];
      });
    };
    fs.readdirSync(dirPartial).forEach(function (partial) {
      partials[path.basename(partial, ".mustache")] = fs.readFileSync(
        path.join(dirPartial, partial),
        "utf8"
      );
    });
    async.each(this.files, function (file, next) {
      var template;
      var fileTemplate = file.src[0];

      try {
        template = fs.readFileSync(fileTemplate, "utf8");
      } catch (e) {
        grunt.log.writeln('Template file "' + fileTemplate + '" not found.');

        return next();
      }

      fs.outputFileSync(
        file.dest,
        mustache.render(template, extendData(fileTemplate), partials)
      );
      grunt.log.writeln('File "' + file.dest + '" created.');
      next();
    }, function (error) {
      done(error);
    });
  });
};
