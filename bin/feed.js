#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const mustache = require("mustache");
const waterfall = require("../lib/waterfall");

const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
const files = [
  {
    caches: ["../cache/articles.json"],
    data: "../src/html/blog/index.json",
    dest: "../dist/blog/feed",
    src: "../src/feed/blog/index.mustache"
  },
  {
    caches: [
      "../src/updates.json",
      "../cache/articles.json",
    ],
    data: "../src/html/index.json",
    dest: "../dist/feed",
    src: "../src/feed/index.mustache"
  }
];
const metadataFile = "../package.json";
const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
  "Oct", "Nov", "Dec"];

function readMetadata() {
  return new Promise((resolve, reject) => {
    fs.readJSON(metadataFile, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      resolve(o.metadata);
    });
  });
}

function readData([metadata, file]) {
  return new Promise((resolve, reject) => {
    fs.readJSON(file.data, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      resolve([Object.assign({}, metadata, o), file]);
    });
  });
}

function readCache(cache) {
  return new Promise((resolve, reject) => {
    fs.readJSON(cache, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      resolve(o);
    });
  });
}

function pad(number) {
  if (number >= 10) {
    return number;
  }

  return `0${number}`;
}

function now() {
  const d = new Date();

  return `${dow[d.getDay()]}, ${pad(d.getDate())} ${month[d.getMonth() - 1]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${d.getSeconds()} +0900`;
}

function readCaches([metadata, file]) {
  return Promise.all(file.caches.map(readCache))
    .then((caches) => {
      metadata.items = caches.reduce((a, v) => {
        return a.concat(v);
      })
        .sort((a, b) => {
          return a.unixtime - b.unixtime;
        })
        .reverse()
        .slice(0, 10)
        .map((d) => {
          if (!d.description) {
            d.description = d.body
              .replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
              .replace(/<.*?>/g, "");
          }

          if (!d.pubDate) {
            d.pubDate = `${dow[d.dow]}, ${d.day} ${month[d.month - 1]} ${d.year} ${pad(d.hour)}:${pad(d.minute)}:00 +0900`;
          }

          if (!d.guid) {
            d.guid = d.link;
          }

          return d;
        });
      metadata.lastBuildDate = now();

      return [metadata, file];
    });
}

function readTemplate([metadata, file]) {
  return new Promise((resolve, reject) => {
    fs.readFile(file.src, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      file.template = d;
      resolve([metadata, file]);
    });
  });
}

function render([metadata, file]) {
  file.feed = mustache.render(file.template, metadata);

  return file;
}

function write(file) {
  return new Promise((resolve, reject) => {
    fs.outputFile(file.dest, file.feed, (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

function build(metadata, file) {
  return waterfall([
    readData,
    readCaches,
    readTemplate,
    render,
    write
  ], [metadata, file]);
}

function buildAll(metadata) {
  return Promise.all(files.map(build.bind(null, metadata)));
}

process.chdir(__dirname);
mustache.escape = (s) => {
  return String(s).replace(/[&<>"']/g, (c) => {
    return entityMap[c];
  });
};
waterfall([
  readMetadata,
  buildAll
]).catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
