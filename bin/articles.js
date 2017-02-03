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
    link: `/${
      path.join("blog", path.relative(root, path.dirname(file))).replace(/\\/g, "/")
    }/${
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
  .forEach((l) => {
    if (!/\d+$/.test(l)) {
      return;
    }

    if (!argv.force && argv.file && !l.startsWith(argv.file)) {
      return;
    }

    l = l.split("=>");
    articles.unshift(readArticle(l[0], l[1]));
  });
fs.outputJsonSync(cache, articles.sort((a, b) => {
  return parseInt(b.unixtime, 10) - parseInt(a.unixtime, 10);
}).filter((v, i, a) => {
  return a.indexOf(v) === i;
}), {
  spaces: 2
});
