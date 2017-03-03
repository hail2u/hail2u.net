#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const minimist = require("minimist");
const path = require("path");

const argv = minimist(process.argv.slice(2), {
  boolean: ["force"],
  string: ["file"]
});
const articles = [];
const dest = "../cache/articles.json";
const root = "../src/weblog/entries/";
const src = "../src/weblog/plugins/state/files_index.dat";

function readArticle(file, date) {
  file = path.normalize(file);
  date = new Date(parseInt(date, 10) * 1000);

  return {
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
  };
}

process.chdir(__dirname);

if (!argv.force && !argv.file) {
  return;
}

if (!argv.force) {
  articles.push(...fs.readJSONSync(dest));
}

fs.readFileSync(src, "utf8")
  .split(/\r?\n/)
  .forEach((l) => {
    if (!/\d+$/.test(l)) {
      return;
    }

    if (!argv.force && !l.startsWith(argv.file)) {
      return;
    }

    articles.unshift(readArticle(...l.split("=>")));
  });
fs.outputJSONSync(dest, [...new Set(articles.sort((a, b) => {
  return parseInt(b.unixtime, 10) - parseInt(a.unixtime, 10);
}))], {
  spaces: 2
});
