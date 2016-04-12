#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");
var minimist = require("minimist");
var path = require("path");

var argv = minimist(process.argv.slice(2), {
  boolean: ["force"],
  string: ["file"]
});
var articles = [];
var cache = "cache/articles.json";
var data = "src/weblog/plugins/state/files_index.dat";
var fileNew = argv.file;
var force = argv.force;
var loadArticle = function (file, date) {
  return {
    day: date.getDate(),
    hour: date.getHours(),
    link: "/blog/" + path.dirname(file).split(path.sep).pop() + "/" +
      path.basename(file, ".txt") + ".html",
    minute: date.getMinutes(),
    month: date.getMonth() + 1,
    second: date.getSeconds(),
    title: fs.readFileSync(file, "utf8").split(/\n/).shift(),
    tz: "+09:00",
    unixtime: date.getTime(),
    year: date.getFullYear()
  };
};

if (!force && !fileNew) {
  return;
}

if (!force) {
  articles = fs.readJsonSync(cache);
}

fs.readFileSync(data, "utf8").split(/\r?\n/).forEach(function (line) {
  var date;
  var file;

  if (!/\d+$/.test(line)) {
    return;
  }

  if (
    !force &&
    fileNew &&
    !line.startsWith(fileNew)
  ) {
    return;
  }

  line = line.split("=>");
  file = line.shift();
  date = line.shift();
  articles.unshift(
    loadArticle(
      path.relative(process.cwd(), file),
      new Date(parseInt(date, 10) * 1000)
    )
  );
});
fs.writeJsonSync(cache, articles.sort(function (a, b) {
  return parseInt(a.unixtime, 10) - parseInt(b.unixtime, 10);
}).reverse());
