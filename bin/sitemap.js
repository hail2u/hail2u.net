#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const path = require("path");
const xml2js = require("xml2js");

const dest = "../dist/sitemap.xml";
const sitemap = {
  urlset: {
    $: {
      xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9"
    },
    url: [
      "/",
      "/about/",
      "/about/style-guide/",
      "/blog/",
      "/documents/"
    ]
  }
};
const src = {
  articles: "../cache/articles.json",
  documents: "../dist/documents/"
};

process.chdir(__dirname);
fs.readdirSync(src.documents).forEach((f) => {
  if (f === "index.html") {
    return false;
  }

  if (path.extname(f) !== ".html") {
    return false;
  }

  sitemap.urlset.url.push(`/${path.basename(src.documents)}/${f}`);
});
fs.readJSONSync(src.articles, "utf8").forEach((a) => {
  sitemap.urlset.url.push(a.link);
});
sitemap.urlset.url = sitemap.urlset.url.map((u) => {
  return {
    loc: `https://hail2u.net${u}`
  };
});
fs.outputFileSync(dest, new xml2js.Builder().buildObject(sitemap));
