#!/usr/bin/env node

"use strict";

var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");

var dest = "../dist/about/style-guide/index.html";
var dir = {
  img: "../img/",
  js: "../js/"
};
var site = "https://hail2u.net/";
var src = "../src/css/test.html";

dest = path.resolve(__dirname, dest);
mkdirp.sync(path.dirname(dest));
fs.writeFileSync(
  dest,
  fs.readFileSync(
    path.resolve(__dirname, src),
    "utf8"
  ).replace(
    /\.\.\/\.\.\/node_modules\/unutm\/build\//,
    dir.js
  ).replace(
    /\b(href|src)(=)(")(.*?)(")/g,
    function (m, attribute, equal, openQuote, url, closeQuote) {
      if (url.startsWith(site)) {
        url = url.substr(site.length - 1);
      } else if (url.startsWith(dir.img)) {
        url = "/images" + url.substr(dir.img.length - 1);
      } else if (url.startsWith(dir.js)) {
        url = "/scripts" + url.substr(dir.js.length - 1);
      } else if (/^[\w-]+\.[\w^]+$/.test(url)) {
        url = "/styles/" + url;
      }

      return attribute + equal + openQuote + url + closeQuote;
    }
  )
);
