"use strict";

var fs = require("fs-extra");
var xml2js = require("xml2js");

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
  "/documents/",
  "/links/"
];

fs.readdirSync("src/html/documents/").forEach(function (file) {
  if (file === "index.html" || !file.endsWith(".html")) {
    return false;
  }

  urls.push("/documents/" + file);
});
fs.readJsonSync(
  ".grunt/cache/articles.json",
  "utf8"
).forEach(function (article) {
  urls.push(article.link);
});
urls.forEach(function (url) {
  sitemap.urlset.url.push({
    loc: "https://hail2u.net" + url
  });
});
fs.outputFileSync(
  "dist/sitemap.xml",
  new xml2js.Builder().buildObject(sitemap)
);
