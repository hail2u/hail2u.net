#!/usr/bin/env node

"use strict";

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");
const xml2js = require("xml2js");

const config = {
  cache: "../cache/articles.json",
  dest: "../dist/sitemap.xml",
  documentsDir: "../src/html/documents/",
  sitemap: {
    urlset: {
      $: {
        xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9"
      },
      url: []
    }
  },
  urls: [
    "/",
    "/about/",
    "/about/style-guide/",
    "/blog/",
    "/documents/"
  ]
};

config.dest = path.resolve(__dirname, config.dest);
config.documentsDir = path.resolve(__dirname, config.documentsDir);
fs.readdirSync(config.documentsDir).forEach(function (file) {
  if (file === "index.html" || path.extname(file) !== ".html") {
    return false;
  }

  config.urls.push("/" + path.basename(config.documentsDir) + "/" + file);
});
JSON.parse(
  fs.readFileSync(path.resolve(__dirname, config.cache), "utf8")
).forEach(function (article) {
  config.urls.push(article.link);
});
config.urls.forEach(function (url) {
  config.sitemap.urlset.url.push({
    loc: "https://hail2u.net" + url
  });
});
mkdirp.sync(path.dirname(config.dest));
fs.writeFileSync(
  config.dest,
  new xml2js.Builder().buildObject(config.sitemap)
);
