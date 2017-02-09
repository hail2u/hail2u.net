#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
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
  "/blog/",
  "/documents/"
];

fs.readdirSync(documentsDir).forEach((f) => {
  if (path.extname(f) !== ".html") {
    return false;
  }

  urls.push(`/${path.basename(documentsDir)}/${f}`);
});
fs.readJSONSync(cache).forEach((a) => {
  urls.push(a.link);
});
urls.forEach((u) => {
  sitemap.urlset.url.push({
    loc: `https://hail2u.net${u}`
  });
});
fs.outputFileSync(dest, new xml2js.Builder().buildObject(sitemap));
