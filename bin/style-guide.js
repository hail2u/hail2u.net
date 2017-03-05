#!/usr/bin/env node

"use strict";

const fs = require("fs");

const dest = "../dist/about/style-guide/index.html";
const dir = {
  css: "./",
  img: "../img/",
  js: "../js/"
};
const src = "../src/css/test.html";
const url = "https://hail2u.net/";

process.chdir(__dirname);
fs.writeFileSync(dest, fs.readFileSync(src, "utf8")
  .replace(/\b(href|src)(=)(")(.*?)(")/g, (m, a, e, o, u, c) => {
    if (u.startsWith(url)) {
      u = u.substr(url.length - 1);
    } else if (u.startsWith(dir.css)) {
      u = `/styles${u.substr(dir.css.length - 1)}`;
    } else if (u.startsWith(dir.img)) {
      u = `/images${u.substr(dir.img.length - 1)}`;
    } else if (u.startsWith(dir.js)) {
      u = `/scripts${u.substr(dir.js.length - 1)}`;
    }

    return `${a}${e}${o}${u}${c}`;
  }));
