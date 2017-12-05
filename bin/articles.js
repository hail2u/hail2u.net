#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const minifyHTML = require("../lib/html-minifier");
const minimist = require("minimist");
const mustache = require("mustache");
const path = require("path");
const waterfall = require("../lib/waterfall");

const argv = minimist(process.argv.slice(2), {
  string: ["file"]
});
const cacheFile = "../src/blog/articles.json";
const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
const extradataFile = "../src/blog/article.json";
const metadataFile = "../src/metadata.json";
const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
  "Oct", "Nov", "Dec"];
const partialDir = "../src/partial/";
const rootDir = "../dist/";
const templateFile = "../src/blog/article.mustache";

function readFileOrJSON(file, ...args) {
  if (path.extname(file) === ".json") {
    return fs.readJSON(file, ...args);
  }

  return fs.readFile(file, ...args);
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    readFileOrJSON(file, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve(d);
    });
  });
}

function readPartial(file) {
  return readFile(path.join(partialDir, file))
    .then((v) => {
      return {
        [path.basename(file, ".mustache")]: v
      };
    });
}

function readPartials() {
  return new Promise((resolve, reject) => {
    fs.readdir(partialDir, (e, f) => {
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
  data.description = data.body.replace(/\r?\n/g, "")
    .replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
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
    path.join(rootDir, data.link),
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
  ], [Object.assign({}, data, src), template, partials]);
}

function refineByLink(item) {
  return argv.file.endsWith(item.link);
}

function buildAll([metadata, extradata, cache, template, partials]) {
  if (argv.file) {
    cache = cache.filter(refineByLink);
  }

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
  readFile(metadataFile),
  readFile(extradataFile),
  readFile(cacheFile),
  readFile(templateFile),
  readPartials()
])
  .then(buildAll)
  .catch((e) => {
    console.trace(e);
  });
