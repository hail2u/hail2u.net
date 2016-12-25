#!/usr/bin/env node

"use strict";

const feedmix = require("feedmix");
const fs = require("fs-extra");
const path = require("path");

const dest = path.resolve(__dirname, "../dist/feed");
const feeds = [
  "../src/index.rss",
  "../src/documents.rss",
  "../dist/blog/feed"
].map(function (feed) {
  return fs.readFileSync(path.resolve(__dirname, feed), "utf8");
});

fs.outputFileSync(dest, `${feedmix.stringify(feedmix.merge(feeds, {
  trim: true
}), {
  cdata: true,
  xmldec: {
    encoding: "UTF-8",
    version: "1.0"
  }
})}\n`);
