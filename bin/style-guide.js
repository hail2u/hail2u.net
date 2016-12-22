#!/usr/bin/env node

"use strict";

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const dest = path.resolve(__dirname, "../dist/about/style-guide/index.html");
const dir = {
  img: "../img/",
  js: "../js/"
};
const site = "https://hail2u.net/";
const src = path.resolve(__dirname, "../src/css/test.html");

mkdirp.sync(path.dirname(dest));
fs.writeFileSync(dest, fs.readFileSync(src, "utf8").replace(
  /\.\.\/\.\.\/node_modules\/.*?\/([^/]*?.js)/g,
  `${dir.js}$1`
).replace(
  /\b(href|src)(=)(")(.*?)(")/g,
  function (m, attribute, equal, openQuote, url, closeQuote) {
    if (url.startsWith(site)) {
      url = url.substr(site.length - 1);
    } else if (url.startsWith(dir.img)) {
      url = `/images${url.substr(dir.img.length - 1)}`;
    } else if (url.startsWith(dir.js)) {
      url = `/scripts${url.substr(dir.js.length - 1)}`;
    } else if (/^[\w-]+\.[\w^]+$/.test(url)) {
      url = `/styles/${url}`;
    }

    return `${attribute}${equal}${openQuote}${url}${closeQuote}`;
  }
));
