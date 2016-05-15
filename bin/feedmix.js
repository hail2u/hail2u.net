#!/usr/bin/env node

"use strict";

var feedmix = require("feedmix");
var fs = require("fs");
var path = require("path");

var dest = "../dist/feed";
var feeds = [
  "../src/index.rss",
  "../dist/blog/feed"
];

feeds = feeds.map(function (feed) {
  return fs.readFileSync(path.resolve(__dirname, feed), "utf8");
});
fs.writeFileSync(
  path.resolve(__dirname, dest),
  feedmix.stringify(feedmix.merge(feeds, {
    trim: true
  }), {
    cdata: true,
    xmldec: {
      encoding: "UTF-8",
      version: "1.0"
    }
  }) + "\n"
);
