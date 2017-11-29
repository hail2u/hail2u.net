#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const minifyHTML = require("../lib/html-minifier");
const mustache = require("mustache");
const path = require("path");
const waterfall = require("../lib/waterfall");

const config = {
  cache: "../src/blog/articles.json",
  extradata: "../src/blog/article.json",
  metadata: "../src/metadata.json",
  partial: "../src/partial/",
  root: "../dist/",
  template: "../src/blog/article.mustache"
};
const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
  "Oct", "Nov", "Dec"];

function readFile(file) {
  let readSomething = fs.readFile;

  if (path.extname(file) === ".json") {
    readSomething = fs.readJSON;
  }

  return new Promise((resolve, reject) => {
    readSomething(file, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      resolve(o);
    });
  });
}

function readPartial(file) {
  return readFile(path.join(config.partial, file))
    .then((v) => {
      return {
        [path.basename(file, ".mustache")]: v
      };
    });
}

function readPartials() {
  return new Promise((resolve, reject) => {
    fs.readdir(config.partial, (e, f) => {
      if (e) {
        return reject(e);
      }

      return Promise.all(f.map(readPartial))
        .then((v) => {
          resolve(v.reduce((p, c) => {
            return Object.assign(p, c);
          }));
        });
    });
  });
}

function findCover(image, defaultCover) {
  if (!image) {
    return defaultCover;
  }

  return image[1];
}

function pad(number) {
  if (number >= 10) {
    return number;
  }

  return `0${number}`;
}

function extendData([data, template, partials]) {
  const dt = new Date(data.unixtime);
  const cover = findCover(
    /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/.exec(data.body),
    data.cover
  );

  data.year = dt.getFullYear();
  data.month = dt.getMonth() + 1;
  data.date = dt.getDate();
  data.day = dt.getDay();
  data.hour = dt.getHours();
  data.minute = dt.getMinutes();
  data.second = dt.getSeconds();
  data.html5PubDate = `${data.year}-${pad(data.month)}-${pad(data.date)}T${pad(data.hour)}:${pad(data.minute)}:${pad(data.second)}+09:00`;
  data.rfc822PubDate = `${day[data.day]}, ${data.date} ${month[data.month - 1]} ${data.year} ${pad(data.hour)}:${pad(data.minute)}:${pad(data.second)} +0900`;
  data.strPubDate = `${pad(data.month)}/${pad(data.date)}`;
  data.canonical = data.link;
  data.description = data.body.replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
    .replace(/<.*?>/g, "");
  data.short_title = data.title;

  if (cover !== data.cover) {
    data.card_type = "summary_large_image";
    data.cover = cover;
  }

  return [data, template, partials];
}

function renderHTML([data, template, partials]) {
  return [
    path.join(config.root, data.link),
    mustache.render(template, data, partials)
  ];
}

function writeHTML([dest, html]) {
  return new Promise((resolve, reject) => {
    fs.outputFile(dest, minifyHTML(html), (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

function build(data, template, partials, src) {
  return waterfall([
    extendData,
    renderHTML,
    writeHTML
  ], [Object.assign({}, data, src), template, partials])
    .catch((e) => {
      throw e;
    });
}

function buildAll([metadata, extradata, cache, template, partials]) {
  Object.assign(metadata, extradata);

  return Promise.all(cache.map(build.bind(null, metadata, template, partials)));
}

process.chdir(__dirname);
mustache.escape = (s) => {
  return String(s)
    .replace(/[&<>"']/g, (c) => {
      return entityMap[c];
    });
};
Promise.all([
  readFile(config.metadata),
  readFile(config.extradata),
  readFile(config.cache),
  readFile(config.template),
  readPartials()
])
  .then(buildAll)
  .catch((e) => {
    throw e;
  });
