#!/usr/bin/env node

"use strict";

var fs = require("fs");
var minimist = require("minimist");
var path = require("path");

var argv = minimist(process.argv.slice(2), {
  boolean: ["force"],
  string: ["file"]
});
var articles = [];
var cache = "../cache/articles.json";
var data = "../src/weblog/plugins/state/files_index.dat";

function readArticle(file, date) {
  return {
    day: date.getDate(),
    hour: date.getHours(),
    link: "/blog/" + path.basename(path.dirname(file)) + "/" +
      path.basename(file, ".txt") + ".html",
    minute: date.getMinutes(),
    month: date.getMonth() + 1,
    second: date.getSeconds(),
    title: fs.readFileSync(file, "utf8").split(/\n/).shift(),
    tz: "+09:00",
    unixtime: date.getTime(),
    year: date.getFullYear()
  };
}

cache = path.resolve(__dirname, cache);

if (!argv.force && !argv.file) {
  return;
}

if (!argv.force) {
  articles = JSON.parse(fs.readFileSync(cache, "utf8"));
}

fs.readFileSync(
  path.resolve(__dirname, data),
  "utf8"
).split(/\r?\n/).forEach(function (line) {
  var date;
  var file;

  if (!/\d+$/.test(line)) {
    return;
  }

  if (
    !argv.force &&
    argv.file &&
    !line.startsWith(argv.file)
  ) {
    return;
  }

  line = line.split("=>");
  file = line.shift();
  date = line.shift();
  articles.unshift(
    readArticle(
      file,
      new Date(parseInt(date, 10) * 1000)
    )
  );
});
fs.writeFileSync(cache, JSON.stringify(articles.sort(function (a, b) {
  return parseInt(b.unixtime, 10) - parseInt(a.unixtime, 10);
}).filter(function (val, idx, arr) {
  return arr.indexOf(val) === idx;
}), 2));
