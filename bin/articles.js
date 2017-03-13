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

function readArticle(line) {
  if (!argv.force && !line.startsWith(argv.file)) {
    return;
  }

  const [file, time] = line.split("=>");
  const date = new Date(parseInt(time, 10) * 1000);

  articles.unshift({
    day: date.getDate(),
    hour: date.getHours(),
    link: `/${path.join(
      "blog",
      path.relative(root, path.dirname(file)),
      `${path.basename(file, ".txt")}.html`
    ).replace(/\\/g, "/")}`,
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

function sort(a, b) {
  return parseInt(b.unixtime, 10) - parseInt(a.unixtime, 10);
}

function unique(value, index, self) {
  return self.indexOf(value) === index;
}

process.chdir(__dirname);

if (!argv.file && !argv.force) {
  return;
}

if (argv.file) {
  argv.file = path.resolve(argv.file).replace(/\\/g, "/");
  articles.push(...fs.readJSONSync(dest, "utf8"));
}

fs.readFileSync(src, "utf8")
  .trim()
  .split(/\r?\n/)
  .forEach(readArticle);
fs.outputJSONSync(dest, articles.sort(sort).filter(unique), {
  spaces: 2
});
