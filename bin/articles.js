#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const minimist = require("minimist");
const path = require("path");

const argv = minimist(process.argv.slice(2), {
  boolean: ["force"],
  string: ["file"]
});
const cache = "../cache/articles.json";
const index = "../src/weblog/plugins/state/files_index.dat";
const root = "../src/weblog/entries/";
let articles = [];

process.chdir(__dirname);

if (!argv.force && !argv.file) {
  return;
}

if (!argv.force) {
  articles = fs.readJSONSync(cache);
}

fs.readFileSync(index, "utf8")
  .split(/\r?\n/)
  .forEach((l) => {
    if (!/\d+$/.test(l)) {
      return;
    }

    if (!argv.force && argv.file && !l.startsWith(argv.file)) {
      return;
    }

    let [file, date] = l.split("=>");

    file = path.normalize(file);
    date = new Date(parseInt(date, 10) * 1000);
    articles.unshift({
      day: date.getDate(),
      hour: date.getHours(),
      link: `/blog/${path.relative(root, path.dirname(file))}/${path.basename(file, ".txt")}.html`,
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
  });
fs.outputJSONSync(cache, articles.sort((a, b) => {
  return parseInt(b.unixtime, 10) - parseInt(a.unixtime, 10);
}).filter((v, i, a) => {
  return a.indexOf(v) === i;
}), {
  spaces: 2
});
