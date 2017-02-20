#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const path = require("path");
const xml2js = require("xml2js");

const cache = "../cache/articles.json";
const dest = "../dist/sitemap.xml";
const documentsDir = "../dist/documents/";
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

process.chdir(__dirname);
fs.readdirSync(documentsDir).forEach((f) => {
  if (f === "index.html") {
    return false;
  }

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
