#!/usr/bin/env node

"use strict";

const feedmix = require("feedmix");
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const dest = path.resolve(__dirname, "../dist/feed");
const feeds = [
  "../src/index.rss",
  "../dist/blog/feed"
].map(function (feed) {
  return fs.readFileSync(path.resolve(__dirname, feed), "utf8");
});

mkdirp.sync(path.dirname(dest));
fs.writeFileSync(dest, feedmix.stringify(feedmix.merge(feeds, {
  trim: true
}), {
  cdata: true,
  xmldec: {
    encoding: "UTF-8",
    version: "1.0"
  }
}) + "\n");
