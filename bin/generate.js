#!/usr/bin/env node

"use strict";

const each = require("async").each;
const fs = require("fs-extra");
const minifyHTML = require("html-minifier").minify;
const minimist = require("minimist");
const mustache = require("mustache");
const parseXML = require("xml2js").parseString;
const path = require("path");

const argv = minimist(process.argv.slice(2), {
  boolean: ["blog"]
});
const articleCache = path.resolve(__dirname, "../cache/articles.json");
const blogFiles = [
  {
    src: "../src/html/blog/index.mustache"
  },
  {
    src: "../src/html/index.mustache"
  }
];
const defaultFiles = [
  {
    src: "../src/html/404.mustache"
  },
  {
    src: "../src/html/about/index.mustache"
  },
  {
    dest: "../src/weblog/entries/themes/html/page",
    src: "../src/html/blog/theme.mustache"
  },
  {
    src: "../src/html/documents/index.mustache"
  }
];
const feeds = {
  documents: "../src/documents.rss",
  home: "../src/index.rss",
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
const basicMetadata = fs.readJsonSync(metadataFile);
const partialDir = path.join(__dirname, "../src/html/partial");
const partials = {};
const templateDir = path.resolve(__dirname, "../src/html/");

let files = blogFiles;

function escape(str) {
  return String(str).replace(/[&<>"']/g, function (s) {
    return entityMap[s];
  });
}

function extendObject(dest, src) {
  if (dest !== Object(dest)) {
    return dest;
  }

  for (const prop in src) {
    dest[prop] = src[prop];
  }

  return dest;
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
  }, function (error, data) {
    if (error) {
      throw error;
    }

    feed = data.rss.channel;
  });

  feed.item.forEach(function (i) {
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
  const articles = fs.readJsonSync(articleCache).map(function (a, idx, arr) {
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

function readMetadata(metadata, file) {
  metadata = extendObject(metadata, fs.readJsonSync(file, "utf8"));

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

for (const f in feeds) {
  feeds[f] = path.resolve(__dirname, feeds[f]);
}

if (!argv.blog) {
  files = files.concat(defaultFiles);
}

mustache.escape = escape;
fs.readdirSync(partialDir).forEach(function (partial) {
  partials[path.basename(partial, ".mustache")] = fs.readFileSync(path.join(partialDir, partial), "utf8");
});
each(files, function (file, next) {
  file.src = path.resolve(__dirname, file.src);

  if (!file.dest) {
    file.dest = path.join("../dist/", path.dirname(path.relative(templateDir, file.src)), `${path.basename(file.src, ".mustache")}.html`);
  }

  file.dest = path.resolve(__dirname, file.dest);
  let html = mustache.render(fs.readFileSync(file.src, "utf8"), readMetadata(extendObject({}, basicMetadata), path.join(path.dirname(file.src), `${path.basename(file.src, ".mustache")}.json`)), partials);

  if (!file.dest.endsWith(`${path.sep}page`)) {
    html = minifyHTML(html, {
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeAttributeQuotes: true,
      removeComments: true,
      removeEmptyElements: true,
      removeOptionalTags: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      sortAttributes: true,
      sortClassName: true,
      useShortDoctype: true
    });
  }

  fs.outputFileSync(file.dest, html);
  next();
}, function (err) {
  if (err) {
    throw err;
  }
});
