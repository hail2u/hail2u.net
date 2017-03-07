#!/usr/bin/env node

"use strict";

const feedmix = require("feedmix");
const fs = require("fs-extra");

const dest = "../dist/feed";
const src = [
  "../src/feed/index.rss",
  "../src/feed/documents.rss",
  "../dist/blog/feed"
];

process.chdir(__dirname);
fs.outputFileSync(dest, `${feedmix.stringify(feedmix.merge(src.map((f) => {
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
