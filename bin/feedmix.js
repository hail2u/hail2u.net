#!/usr/bin/env node

"use strict";

var feedmix = require("feedmix");
var fs = require("fs-extra");
var path = require("path");

fs.outputFileSync(
  path.resolve(__dirname, "../dist/feed"),
  feedmix.stringify(feedmix.merge([
    fs.readFileSync(path.resolve(__dirname, "../src/index.rss")),
    fs.readFileSync(path.resolve(__dirname, "../dist/blog/feed"))
  ], {
    trim: true
  }), {
    cdata: true,
    xmldec: {
      encoding: "UTF-8",
      version: "1.0"
    }
  }) + "\n"
);
