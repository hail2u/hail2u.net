#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const minimist = require("minimist");
const path = require("path");

const argv = minimist(process.argv.slice(2), {
  boolean: ["force"],
  string: ["file"]
});
const cache = path.resolve(__dirname, "../cache/articles.json");
const data = path.resolve(__dirname, "../src/weblog/plugins/state/files_index.dat");
const root = path.resolve(__dirname, "../src/weblog/entries/");

let articles = [];

function readArticle(file, date) {
  date = new Date(parseInt(date, 10) * 1000);

  return {
    day: date.getDate(),
    hour: date.getHours(),
    link: `/blog/${
      path.relative(root, path.dirname(file)).replace(/\\/g, "/")
    }${
      path.basename(file, ".txt")
    }.html`,
    minute: date.getMinutes(),
    month: date.getMonth() + 1,
    second: date.getSeconds(),
    title: fs.readFileSync(file, "utf8")
      .split(/\n/)
      .shift()
      .replace(/<\/?h1>/g, ""),
    tz: "+09:00",
    unixtime: date.getTime(),
    year: date.getFullYear()
  };
}

if (!argv.force && !argv.file) {
  return;
}

if (!argv.force) {
  articles = fs.readJsonSync(cache);
}

fs.readFileSync(data, "utf8")
  .split(/\r?\n/)
  .forEach(function (line) {
    if (!/\d+$/.test(line)) {
      return;
    }

    if (!argv.force && argv.file && !line.startsWith(argv.file)) {
      return;
    }

    line = line.split("=>");
    articles.unshift(readArticle(line[0], line[1]));
  });
fs.outputFileSync(cache, articles.sort(function (a, b) {
  return parseInt(b.unixtime, 10) - parseInt(a.unixtime, 10);
}).filter(function (val, idx, arr) {
  return arr.indexOf(val) === idx;
}), {
  spaces: 2
});
