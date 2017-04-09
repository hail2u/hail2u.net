#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const minimist = require("minimist");
const path = require("path");
const toPOSIXPath = require("../lib/to-posix-path");
const waterfall = require("../lib/waterfall");

const argv = minimist(process.argv.slice(2), {
  boolean: ["force"],
  string: ["file"]
});
const dest = "../cache/articles.json";
const root = "../src/weblog/entries/";
const src = "../src/weblog/plugins/state/files_index.dat";

function readCache() {
  if (!argv.file) {
    return [];
  }

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
  if (!argv.force && !line.startsWith(argv.file)) {
    return;
  }

  const [file, time] = line.split("=>");
  const date = new Date(parseInt(time, 10) * 1000);

  articles.push({
    day: date.getDate(),
    hour: date.getHours(),
    link: `/${toPOSIXPath(path.join(
      "blog",
      path.relative(root, path.dirname(file)),
      `${path.basename(file, ".txt")}.html`
    ))}`,
    minute: date.getMinutes(),
    month: date.getMonth() + 1,
    second: date.getSeconds(),
    title: fs.readFileSync(file, "utf8")
      .trim()
      .split(/\n/)
      .shift()
      .replace(/<\/?h1>/g, ""),
    tz: "+09:00",
    unixtime: date.getTime(),
    year: date.getFullYear()
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

function sort(a, b) {
  return parseInt(b.unixtime, 10) - parseInt(a.unixtime, 10);
}

function unique(value, index, self) {
  return self.indexOf(value) === index;
}

function writeCache(articles) {
  return new Promise((resolve, reject) => {
    fs.outputJSON(dest, articles.sort(sort).filter(unique), (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

process.chdir(__dirname);

if (!argv.file && !argv.force) {
  return;
}

if (argv.file) {
  argv.file = toPOSIXPath(path.resolve(argv.file));
}

waterfall([
  readCache,
  addArticle,
  writeCache
]).catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
