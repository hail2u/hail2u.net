#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");

const dest = "../dist/style-guide/index.html";
const dir = "../";
const src = "../src/css/test.html";
const url = "https://hail2u.net/";

process.chdir(__dirname);
fs.outputFileSync(dest, fs.readFileSync(src, "utf8")
  .replace(/\b(href|src)(=)(")(.*?)(")/g, (m, a, e, o, u, c) => {
    if (u.startsWith(url)) {
      u = u.substr(url.length - 1);
    } else if (u.startsWith(dir)) {
      u = u.substr(dir.length - 1);
    }

    return `${a}${e}${o}${u}${c}`;
  }));
