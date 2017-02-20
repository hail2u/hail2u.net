#!/usr/bin/env node

"use strict";

const feedmix = require("feedmix");
const fs = require("fs-extra");
const path = require("path");

const dest = path.resolve(__dirname, "../dist/feed");
const feeds = [
  path.resolve(__dirname, "../src/feed/index.rss"),
  path.resolve(__dirname, "../src/feed/documents.rss"),
  path.resolve(__dirname, "../dist/blog/feed")
];

fs.outputFileSync(dest, `${feedmix.stringify(feedmix.merge(feeds.map((f) => {
  return fs.readFileSync(f, "utf8");
}), {
  trim: true
}), {
  cdata: true,
  xmldec: {
    encoding: "UTF-8",
    version: "1.0"
  }
})}\n`);
