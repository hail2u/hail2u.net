"use strict";

module.exports = function (grunt) {
  var taskName = "sitemap";
  var taskDescription = "Generate a sitemap XML file.";

  grunt.registerTask(taskName, taskDescription, function () {
    var fs = require("fs-extra");
    var path = require("path");
    var xml2js = require("xml2js");

    var dest = "dist/sitemap.xml";
    var domain = "hail2u.net";
    var scheme = "https:";
    var sitemap = {
      urlset: {
        $: {
          xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9"
        },
        url: []
      }
    };
    var urls = [
      "/",
      "/about/",
      "/about/style-guide/",
      "/blog/",
      "/blog/blog/",
      "/blog/blosxom/",
      "/blog/coding/",
      "/blog/gadget/",
      "/blog/game/",
      "/blog/internet/",
      "/blog/media",
      "/blog/misc/",
      "/blog/rss/",
      "/blog/software/",
      "/blog/sports/",
      "/blog/webdesign/",
      "/documents/"
    ];

    fs.readdirSync("src/html/documents/").forEach(function (file) {
      if (file === "index.html" || file.indexOf(".html") !== file.length - 5) {
        return false;
      }

      urls.push("/documents/" + file);
    });
    JSON.parse(fs.readFileSync(path.join(
      __dirname,
      "cache",
      "articles.json"
    ), "utf8")).forEach(function (article) {
      urls.push(article.link);
    });
    urls.forEach(function (url) {
      sitemap.urlset.url.push({
        loc: scheme + "//" + domain + url
      });
    });
    fs.outputFileSync(dest, new xml2js.Builder().buildObject(sitemap));
    grunt.log.writeln('Sitemap "' + dest + '" created.');
  });
};
