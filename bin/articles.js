#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const minimist = require("minimist");
const path = require("path");
const toPOSIXPath = require("../lib/to-posix-path");
const waterfall = require("../lib/waterfall");

const argv = minimist(process.argv.slice(2), {
  string: ["file"]
});
const dest = "../src/blog/articles.json";
const root = "../src/blosxom/entries/";
const src = "../src/blosxom/plugins/state/files_index.dat";

function readCache() {
  if (!argv.file) {
    return [];
  }

  argv.file = toPOSIXPath(path.resolve(argv.file));

  return new Promise((resolve, reject) => {
    fs.readJSON(dest, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      resolve(o);
    });
  });
}

function readArticle(articles, line) {
  if (argv.file && !line.startsWith(argv.file)) {
    return;
  }

  const [file, time] = line.split("=>");
  const [title, ...body] = fs.readFileSync(file, "utf8")
    .trim()
    .split("\n");

  articles.push({
    body: body.join(""),
    link: `/${toPOSIXPath(path.join(
      "blog",
      path.relative(root, path.dirname(file)),
      `${path.basename(file, ".txt")}.html`
    ))}`,
    title: title.replace(/<\/?h1>/g, ""),
    unixtime: parseInt(time, 10) * 1000
  });
}

function addArticle(articles) {
  return new Promise((resolve, reject) => {
    fs.readFile(src, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      d.trim()
        .split(/\r?\n/)
        .forEach(readArticle.bind(null, articles));
      resolve(articles);
    });
  });
}

function sortByDate(a, b) {
  return parseInt(b.unixtime, 10) - parseInt(a.unixtime, 10);
}

function isDuplicate(link, current) {
  return current.link === link;
}

function uniqueByLink(value, index, self) {
  return self.findIndex(isDuplicate.bind(null, value.link)) === index;
}

function writeCache(articles) {
  return new Promise((resolve, reject) => {
    fs.outputJSON(dest, articles.sort(sortByDate)
      .filter(uniqueByLink), {
      spaces: 2
    }, (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

process.chdir(__dirname);
waterfall([
  readCache,
  addArticle,
  writeCache
])
  .catch((e) => {
    console.error(e.stack);
    process.exit(1);
  });
