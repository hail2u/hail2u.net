#!/usr/bin/env node

"use strict";

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");
const xml2js = require("xml2js");

const cache = path.resolve(__dirname, "../cache/articles.json");
const dest = path.resolve(__dirname, "../dist/sitemap.xml");
const documentsDir = path.resolve(__dirname, "../src/html/documents/");
const sitemap = {
  urlset: {
    $: {
      xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9"
    },
    url: []
  }
};
const urls = [
  "/",
  "/about/",
  "/about/style-guide/",
  "/blog/"
];

fs.readdirSync(documentsDir).forEach(function (file) {
  if (path.extname(file) !== ".html") {
    return false;
  }

  urls.push("/" + path.basename(documentsDir) + "/" + file);
});
JSON.parse(fs.readFileSync(cache, "utf8")).forEach(function (article) {
  urls.push(article.link);
});
urls.forEach(function (url) {
  sitemap.urlset.url.push({
    loc: "https://hail2u.net" + url
  });
});
mkdirp.sync(path.dirname(dest));
fs.writeFileSync(dest, new xml2js.Builder().buildObject(sitemap));
