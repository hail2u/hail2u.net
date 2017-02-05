#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const path = require("path");

const dest = path.resolve(__dirname, "../dist/about/style-guide/index.html");
const dir = {
  img: "../img/",
  js: "../js/"
};
const site = "https://hail2u.net/";
const src = path.resolve(__dirname, "../src/css/test.html");

fs.outputFileSync(dest, fs.readFileSync(src, "utf8")
  .replace(/\b(href|src)(=)(")(.*?)(")/g, (m, a, eq, oq, u, cq) => {
    if (u.startsWith(site)) {
      u = u.substr(site.length - 1);
    } else if (u.startsWith(dir.img)) {
      u = `/images${u.substr(dir.img.length - 1)}`;
    } else if (u.startsWith(dir.js)) {
      u = `/scripts${u.substr(dir.js.length - 1)}`;
    } else if (/^[\w-]+\.[\w^]+$/.test(u)) {
      u = `/styles/${u}`;
    }

    return `${a}${eq}${oq}${u}${cq}`;
  }));
