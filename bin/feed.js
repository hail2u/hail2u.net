#!/usr/bin/env node

"use strict";

const feedmix = require("feedmix");
const fs = require("fs-extra");
const waterfall = require("../lib/waterfall");

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

function readAll() {
  return Promise.all(src.map(read));
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
waterfall([
  readAll,
  merge,
  stringify,
  write
]).catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
