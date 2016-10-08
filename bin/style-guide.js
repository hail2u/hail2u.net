#!/usr/bin/env node

"use strict";

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const config = {
  dest: "../dist/about/style-guide/index.html",
  dir: {
    img: "../img/",
    js: "../js/"
  },
  site: "https://hail2u.net/",
  src: "../src/css/test.html",
};

config.dest = path.resolve(__dirname, config.dest);
config.src = path.resolve(__dirname, config.src);
mkdirp.sync(path.dirname(config.dest));
fs.writeFileSync(
  config.dest,
  fs.readFileSync(config.src, "utf8").replace(
    /\.\.\/\.\.\/node_modules\/.*?\/([^/]*?.js)/g,
    config.dir.js + "$1"
  ).replace(
    /\b(href|src)(=)(")(.*?)(")/g,
    function (m, attribute, equal, openQuote, url, closeQuote) {
      if (url.startsWith(config.site)) {
        url = url.substr(config.site.length - 1);
      } else if (url.startsWith(config.dir.img)) {
        url = "/images" + url.substr(config.dir.img.length - 1);
      } else if (url.startsWith(config.dir.js)) {
        url = "/scripts" + url.substr(config.dir.js.length - 1);
      } else if (/^[\w-]+\.[\w^]+$/.test(url)) {
        url = "/styles/" + url;
      }

      return attribute + equal + openQuote + url + closeQuote;
    }
  )
);
