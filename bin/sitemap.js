#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const path = require("path");
const series = require("async").series;
const xml2js = require("xml2js");

const cache = path.resolve(__dirname, "../cache/articles.json");
const dest = path.resolve(__dirname, "../dist/sitemap.xml");
const documentsDir = path.resolve(__dirname, "../dist/documents/");
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

function addDocument(filename) {
  if (filename === "index.html") {
    return false;
  }

  if (path.extname(filename) !== ".html") {
    return false;
  }

  urls.push(`/${path.basename(documentsDir)}/${filename}`);
}

function gatherDocuments(next) {
  fs.readdir(documentsDir, (e, f) => {
    if (e) {
      return next(e);
    }

    f.forEach(addDocument);
    next();
  });
}

function gatherBlogEntries(next) {
  fs.readJSON(cache, (e, o) => {
    if (e) {
      return next(e);
    }

    o.forEach((a) => {
      urls.push(a.link);
    });
    next();
  });
}

function toAbsoluteURL(next) {
  urls.forEach((u) => {
    sitemap.urlset.url.push({
      loc: `https://hail2u.net${u}`
    });
  });
  next();
}

function saveSitemap(next) {
  fs.outputFile(dest, new xml2js.Builder().buildObject(sitemap), (e) => {
    if (e) {
      return next(e);
    }

    next();
  });
}

series([
  gatherDocuments,
  gatherBlogEntries,
  toAbsoluteURL,
  saveSitemap
], (e) => {
  if (e) {
    throw e;
  }
});
