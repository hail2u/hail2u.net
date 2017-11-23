#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const minifyHTML = require("../lib/html-minifier");
const mustache = require("mustache");
const path = require("path");
const waterfall = require("../lib/waterfall");

const dirPartial = "../src/partial/";
const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
const files = [
  {
    dest: "../dist/about/index.html",
    json: "../src/about/index.json",
    src: "../src/about/index.mustache"
  },
  {
    dest: "../dist/blog/feed",
    json: "../src/blog/index.json",
    itemLength: 10,
    src: "../src/blog/feed.mustache"
  },
  {
    dest: "../dist/blog/index.html",
    json: "../src/blog/index.json",
    src: "../src/blog/index.mustache"
  },
  {
    dest: "../src/blosxom/entries/themes/html/page",
    json: "../src/blog/theme.json",
    src: "../src/blog/theme.mustache"
  },
  {
    dest: "../dist/documents/index.html",
    json: "../src/documents/index.json",
    src: "../src/documents/index.mustache"
  },
  {
    dest: "../dist/projects/index.html",
    json: "../src/projects/index.json",
    src: "../src/projects/index.mustache"
  },
  {
    dest: "../dist/feed",
    json: "../src/index.json",
    itemLength: 10,
    src: "../src/feed.mustache"
  },
  {
    dest: "../dist/index.html",
    json: "../src/index.json",
    includeUpdates: true,
    itemLength: 10,
    src: "../src/index.mustache"
  },
  {
    dest: "../dist/sitemap.xml",
    json: "../src/index.json",
    src: "../src/sitemap.mustache"
  }
];
const itemFiles = [
  "../src/blog/articles.json",
  "../src/updates.json"
];
const metadataFile = "../src/metadata.json";
const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
  "Oct", "Nov", "Dec"];

function readMetadata() {
  return new Promise((resolve, reject) => {
    fs.readJSON(metadataFile, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      resolve(o);
    });
  });
}

function readItem(file) {
  return new Promise((resolve, reject) => {
    fs.readJSON(file, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      resolve(o);
    });
  });
}

function pad(number) {
  if (number >= 10) {
    return number;
  }

  return `0${number}`;
}

function flatten(previous, current) {
  return previous.concat(current);
}

function byDate(a, b) {
  return a.unixtime - b.unixtime;
}

function extendItem(item, index, original) {
  if (!item.date) {
    const dt = new Date(item.unixtime);

    item.date = dt.getDate();
    item.day = dt.getDay();
    item.hour = dt.getHours();
    item.minute = dt.getMinutes();
    item.month = dt.getMonth() + 1;
    item.second = dt.getSeconds();
    item.tz = "+09:00";
    item.year = dt.getFullYear();
  }

  item.html5PubDate = `${item.year}-${pad(item.month)}-${pad(item.date)}T${pad(item.hour)}:${pad(item.minute)}:${pad(item.second)}+09:00`;
  item.rfc822PubDate = `${day[item.day]}, ${item.date} ${month[item.month - 1]} ${item.year} ${pad(item.hour)}:${pad(item.minute)}:${pad(item.second)} +0900`;
  item.strPubDate = `${pad(item.month)}/${pad(item.date)}`;

  if (!item.description) {
    item.description = item.body
      .replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
      .replace(/<.*?>/g, "");
  }

  if (index === 0) {
    item.isLatest = true;
    index = original.length;
  }

  const previousItem = original[index - 1];

  if (item.year !== previousItem.year) {
    item.isFirstInYear = true;
    previousItem.isLastInYear = true;
  }

  return item;
}

function gatherItems(metadata, items) {
  items = items.reduce(flatten)
    .sort(byDate)
    .reverse()
    .map(extendItem);

  return [metadata, items];
}

function readItems(metadata) {
  return Promise.all(itemFiles.map(readItem))
    .then(gatherItems.bind(null, metadata));
}

function readPartial(file) {
  file = path.join(dirPartial, file);

  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      const partial = {};

      partial[path.basename(file, ".mustache")] = d;
      resolve(partial);
    });
  });
}

function gatherPartials(resolve, metadata, items, partials) {
  return resolve([metadata, items, partials.reduce((a, v) => {
    return Object.assign(a, v);
  })]);
}

function readPartials([metadata, items]) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPartial, (e, f) => {
      if (e) {
        return reject(e);
      }

      return Promise.all(f.map(readPartial))
        .then(gatherPartials.bind(null, resolve, metadata, items));
    });
  });
}

function readTemplate([metadata, items, partials, file]) {
  return new Promise((resolve, reject) => {
    fs.readFile(file.src, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      file.template = d;
      resolve([metadata, items, partials, file]);
    });
  });
}

function filterUpdates(includeUpdates, item) {
  if (item.link.startsWith("/blog/")) {
    return true;
  }

  if (includeUpdates) {
    return true;
  }

  return false;
}

function now() {
  const d = new Date();

  return `${day[d.getDay()]}, ${pad(d.getDate())} ${month[d.getMonth() - 1]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} +0900`;
}

function mergeData([metadata, items, partials, file]) {
  return new Promise((resolve, reject) => {
    fs.readJSON(file.json, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      file.data = Object.assign({}, metadata, o);
      file.data.items = items.concat()
        .filter(filterUpdates.bind(null, file.includeUpdates))
        .slice(0, file.itemLength);
      file.data.lastBuildDate = now();
      resolve([partials, file]);
    });
  });
}

function render([partials, file]) {
  file.contents = mustache.render(file.template, file.data, partials);

  return file;
}

function minify(file) {
  if (file.dest.endsWith(".html")) {
    file.contents = minifyHTML(file.contents);
  }

  return file;
}

function write(file) {
  return new Promise((resolve, reject) => {
    fs.outputFile(file.dest, file.contents, (e) => {
      if (e) {
        return reject(e);
      }

      resolve(file);
    });
  });
}

function build(metadata, items, partials, file) {
  return waterfall([
    readTemplate,
    mergeData,
    render,
    minify,
    write
  ], [metadata, items, partials, file]);
}

function buildAll([metadata, items, partials]) {
  return Promise.all(files.map(build.bind(null, metadata, items, partials)));
}

process.chdir(__dirname);
mustache.escape = (s) => {
  return String(s).replace(/[&<>"']/g, (c) => {
    return entityMap[c];
  });
};
waterfall([
  readMetadata,
  readItems,
  readPartials,
  buildAll
]).catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
