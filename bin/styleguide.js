#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");

var path = {
  img: "../img/",
  js: "../js/"
};
var site = "https://hail2u.net/";

var c = fs.readFileSync("src/css/test.html", "utf-8");
c = c.replace(/(href|src)(=)(")(.*?)(")/g, function (m, at, eq, oq, url, cq) {
  if (url.indexOf(site) === 0) {
    url = url.substr(site.length - 1);
  } else if (url.indexOf(path.img) === 0) {
    url = "/images" + url.substr(path.img.length - 1);
  } else if (url.indexOf(path.js) === 0) {
    url = "/scripts" + url.substr(path.js.length - 1);
  } else if (/^[\w-]+\.[\w^]+$/.test(url)) {
    url = "/styles/" + url;
  }

  return at + eq + oq + url + cq;
});
fs.outputFileSync("dist/about/style-guide/index.html", c);
