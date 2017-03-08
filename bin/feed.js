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

function read(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve(d);
    });
  });
}

function merge(feeds) {
  return feedmix.merge(feeds, {
    trim: true
  });
}

function stringify(feed) {
  return [dest, `${feedmix.stringify(feed, {
    cdata: true,
    xmldec: {
      encoding: "UTF-8",
      version: "1.0"
    }
  })}
`];
}

function write([file, data]) {
  return new Promise((resolve, reject) => {
    fs.outputFile(file, data, (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

process.chdir(__dirname);
Promise.all(src.map(read))
  .then(merge)
  .then(stringify)
  .then(write)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
