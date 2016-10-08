#!/usr/bin/env node

"use strict";

const feedmix = require("feedmix");
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const config = {
  dest: "../dist/feed",
  feeds: [
    "../src/index.rss",
    "../dist/blog/feed"
  ]
};

config.dest = path.resolve(__dirname, config.dest);
config.feeds = config.feeds.map(function (feed) {
  return fs.readFileSync(path.resolve(__dirname, feed), "utf8");
});
mkdirp.sync(path.dirname(config.dest));
fs.writeFileSync(config.dest, feedmix.stringify(feedmix.merge(config.feeds, {
  trim: true
}), {
  cdata: true,
  xmldec: {
    encoding: "UTF-8",
    version: "1.0"
  }
}) + "\n");
