#!/usr/bin/env node

"use strict";

var feedmix = require("feedmix");
var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");

var dest = "../dist/feed";
var feeds = [
  "../src/index.rss",
  "../dist/blog/feed"
];

dest = path.resolve(__dirname, dest);
feeds = feeds.map(function (feed) {
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
