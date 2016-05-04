#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");
var path = require("path");
var xml2js = require("xml2js");

var cache = "../cache/articles.json";
var dest = "../dist/sitemap.xml";
var documentsDir = "../src/html/documents/";
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

fs.readdirSync(path.resolve(__dirname, documentsDir)).forEach(function (file) {
  if (file === "index.html" || path.extname(file) !== ".html") {
    return false;
  }

  urls.push("/" + path.basename(documentsDir) + "/" + file);
});
fs.readJsonSync(path.resolve(__dirname, cache)).forEach(function (article) {
  urls.push(article.link);
});
urls.forEach(function (url) {
  sitemap.urlset.url.push({
    loc: "https://hail2u.net" + url
  });
});
fs.outputFileSync(
  path.resolve(__dirname, dest),
  new xml2js.Builder().buildObject(sitemap)
);
