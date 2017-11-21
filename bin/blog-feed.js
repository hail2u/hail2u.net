#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const mustache = require("mustache");
const waterfall = require("../lib/waterfall");

const cache = "../cache/articles.json";
const dest = "../dist/blog/feed";
const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
  "Oct", "Nov", "Dec"];
const src = "../src/feed/blog/index.mustache";

function readTemplate() {
  return new Promise((resolve, reject) => {
    fs.readFile(src, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve(d);
    });
  });
}

function readCache(template) {
  return new Promise((resolve, reject) => {
    fs.readFile(cache, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve([d, template]);
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

function build([data, template]) {
  data = JSON.parse(data)
    .slice(0, 10)
    .map((d) => {
      d.description = d.body
        .replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
        .replace(/<.*?>/g, "");
      d.pubDate = `${dow[d.dow]}, ${d.day} ${month[d.month - 1]} ${d.year} ${pad(d.hour)}:${pad(d.minute)}:00 +0900`;
      d.guid = d.link;

      return d;
    });

  return mustache.render(template, {
    lastBuildDate: now(),
    items: data
  });
}

function write(feed) {
  return new Promise((resolve, reject) => {
    fs.outputFile(dest, feed, (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

process.chdir(__dirname);
mustache.escape = (s) => {
  return String(s).replace(/[&<>"']/g, (c) => {
    return entityMap[c];
  });
};
waterfall([
  readTemplate,
  readCache,
  build,
  write
]).catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
