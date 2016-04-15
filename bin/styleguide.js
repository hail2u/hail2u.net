#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");
var path = require("path");

var dir = {
  img: "../img/",
  js: "../js/"
};
var site = "https://hail2u.net/";

fs.outputFileSync(
  path.resolve(__dirname, "../dist/about/style-guide/index.html"),
  fs.readFileSync(
    path.resolve(__dirname, "../src/css/test.html"),
    "utf8"
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
