#!/usr/bin/env node

"use strict";

const each = require("async").each;
const fs = require("fs-extra");
const minifyHTML = require("../lib/html-minifier");
const mustache = require("mustache");
const parseXML = require("xml2js").parseString;
const path = require("path");

const articleCache = path.resolve(__dirname, "../cache/articles.json");
const files = [
  {
    dest: "../dist/404.html",
    src: "../src/html/404.mustache"
  },
  {
    dest: "../dist/about/index.html",
    src: "../src/html/about/index.mustache"
  },
  {
    dest: "../dist/blog/index.html",
    src: "../src/html/blog/index.mustache"
  },
  {
    dest: "../src/weblog/entries/themes/html/page",
    src: "../src/html/blog/theme.mustache"
  },
  {
    dest: "../dist/documents/index.html",
    src: "../src/html/documents/index.mustache"
  },
  {
    dest: "../dist/index.html",
    src: "../src/html/index.mustache"
  }
];
const feeds = {
  documents: "../src/feed/documents.rss",
  home: "../src/feed/index.rss",
  weblog: "../dist/blog/feed"
};
const entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
const metadataFile = path.resolve(__dirname, "../src/html/metadata.json");
const basicMetadata = fs.readJSONSync(metadataFile);
const partialDir = path.join(__dirname, "../src/html/partial");
const partials = {};
const templateDir = path.resolve(__dirname, "../src/html/");

function escape(str) {
  return String(str).replace(/[&<>"']/g, (s) => {
    return entityMap[s];
  });
}

function pad(number) {
  if (number >= 10) {
    return number;
  }

  return `0${number}`;
}

function toHTML5Date(yy, mm, dd, hh, nn, ss) {
  return `${yy}-${pad(mm)}-${pad(dd)}T${pad(hh)}:${pad(nn)}:${pad(ss)}+09:00`;
}

function readFeed(file) {
  let feed = {};

  parseXML(fs.readFileSync(file, "utf8"), {
    trim: true,
    explicitArray: false
  }, (e, d) => {
    if (e) {
      throw e;
    }

    feed = d.rss.channel;
  });

  feed.item.forEach((i) => {
    if (i.link) {
      i.link = i.link.replace(/https?:\/\/hail2u\.net\//, "/");
    }

    if (i.pubDate) {
      const d = new Date(i.pubDate);
      const yy = d.getFullYear();
      const mm = d.getMonth() + 1;
      const dd = d.getDate();

      i.strPubDate = `${yy}/${pad(mm)}/${pad(dd)}`;
      i.html5PubDate = toHTML5Date(yy, mm, dd, d.getHours(), d.getMinutes(),
        d.getSeconds());
    }
  });
  feed.item[0].isLatest = true;

  return feed.item;
}

function readArticles() {
  const articles = fs.readJSONSync(articleCache).map(function (a, idx, arr) {
    a.strPubDate = `${pad(a.month)}/${pad(a.day)}`;
    a.html5PubDate = toHTML5Date(a.year, a.month, a.day, a.hour, a.minute,
      a.second);

    if (idx && this.y !== a.year) {
      a.isFirstInYear = true;
      arr[idx - 1].isLastInYear = true;
    }

    this.y = a.year;

    return a;
  }, {
    y: true
  });

  articles[0].isFirstInYear = true;
  articles[articles.length - 1].isLastInYear = true;

  return articles;
}

function readMetadata(file) {
  const metadata = fs.readJSONSync(file, "utf8");

  switch (path.relative(templateDir, file).replace(/\\/g, "/")) {
  case "index.json":
    metadata.features = readFeed(feeds.documents);
    metadata.articles = readFeed(feeds.weblog);

    break;
  case "blog/index.json":
    metadata.articles = readArticles();

    break;
  }

  return metadata;
}

function toHTML(file) {
  const template = fs.readFileSync(file.src, "utf8");
  const json = path.join(path.dirname(file.src), `${path.basename(file.src, ".mustache")}.json`);
  const data = Object.assign(basicMetadata, readMetadata(json));
  const html = mustache.render(template, data, partials);

  if (!file.dest.endsWith(`${path.sep}page`)) {
    return minifyHTML(html);
  }

  return html;
}

function saveAsHTML(file, next) {
  file.dest = path.resolve(__dirname, file.dest);
  file.src = path.resolve(__dirname, file.src);
  fs.outputFileSync(file.dest, toHTML(file));

  return next();
}

for (const f in feeds) {
  feeds[f] = path.resolve(__dirname, feeds[f]);
}

mustache.escape = escape;
fs.readdirSync(partialDir).forEach((p) => {
  partials[path.basename(p, ".mustache")] = fs.readFileSync(path.join(partialDir, p), "utf8");
});
each(files, saveAsHTML, (e) => {
  if (e) {
    throw e;
  }
});
