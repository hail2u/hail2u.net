#!/usr/bin/env node

"use strict";

var fs = require("fs");
var mkdirp = require("mkdirp");
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
  "/documents/"
];

dest = path.resolve(__dirname, dest);
fs.readdirSync(path.resolve(__dirname, documentsDir)).forEach(function (file) {
  if (file === "index.html" || path.extname(file) !== ".html") {
    return false;
  }

  urls.push("/" + path.basename(documentsDir) + "/" + file);
});
JSON.parse(
  fs.readFileSync(path.resolve(__dirname, cache), "utf8")
).forEach(function (article) {
  urls.push(article.link);
});
urls.forEach(function (url) {
  sitemap.urlset.url.push({
    loc: "https://hail2u.net" + url
  });
});
mkdirp.sync(path.dirname(dest));
fs.writeFileSync(
  dest,
  new xml2js.Builder().buildObject(sitemap)
);
