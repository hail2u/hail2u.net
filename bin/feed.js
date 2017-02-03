#!/usr/bin/env node

"use strict";

const feedmix = require("feedmix");
const fs = require("fs-extra");
const path = require("path");

const dest = path.resolve(__dirname, "../dist/feed");
const feeds = [
  "../src/feed/index.rss",
  "../src/feed/documents.rss",
  "../dist/blog/feed"
].map((f) => {
  return fs.readFileSync(path.resolve(__dirname, f), "utf8");
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
