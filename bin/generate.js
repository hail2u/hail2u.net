#!/usr/bin/env node

"use strict";

const eachLimit = require("async").eachLimit;
const fs = require("fs");
const minifyHTML = require("html-minifier").minify;
const minimist = require("minimist");
const mkdirp = require("mkdirp");
const mustache = require("mustache");
const os = require("os");
const parseXML = require("xml2js").parseString;
const path = require("path");
const sprintf = require("sprintf").sprintf;

const articleCache = "../cache/articles.json";
const blogFeed = "../dist/blog/feed";
const blogFiles = [
  {
    src: "../src/html/blog/index.mustache"
  },
  {
    src: "../src/html/index.mustache"
  }
];
const cpuNum = Math.max(1, os.cpus().length - 1);
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
const entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
const homeFeed = "../src/index.rss";
const metadataFile = "../src/html/metadata.json";
const partialDir = path.join(__dirname, "../src/html/partial");
const templateDir = path.resolve(__dirname, "../src/html/");

var argv = minimist(process.argv.slice(2), {
  boolean: ["blog"]
});
var basicMetadata;
var files = defaultFiles;
var partials = {};

function escape(str) {
  return String(str).replace(/[&<>"']/g, function (s) {
    return entityMap[s];
  });
}

function extendObject(dest, src) {
  var prop;

  if (dest !== Object(dest)) {
    return dest;
  }

  for (prop in src) {
    dest[prop] = src[prop];
  }

  return dest;
}

function readRSS(file) {
  var feed = {};

  parseXML(fs.readFileSync(file, "utf8"), {
    trim: true,
    explicitArray: false
  }, function (error, data) {
    if (error) {
      throw error;
    }

    feed = data.rss.channel;
  });

  feed.item.forEach(function (val) {
    var date;
    var yy;
    var mm;
    var dd;

    if (val.link) {
      val.link = val.link.replace(/https?:\/\/hail2u\.net\//, "/");
    }

    if (val.pubDate) {
      date = new Date(val.pubDate);
      yy = date.getFullYear();
      mm = date.getMonth();
      dd = date.getDate();
      val.strPubDate = sprintf("%04d/%02d/%02d", yy, mm + 1, dd);
      val.html5PubDate = sprintf(
        "%04d-%02d-%02dT%02d:%02d:%02d+09:00",
        yy, mm + 1, dd, date.getHours(), date.getMinutes(), date.getSeconds()
      );
    }
  });

  return feed;
}

function readArticles() {
  var articles = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, articleCache), "utf8")
  );

  articles.forEach(function (article, idx) {
    article.strPubDate = sprintf("%02d/%02d", article.month, article.day);
    article.html5PubDate = sprintf(
      "%04d-%02d-%02dT%02d:%02d:%02d+09:00",
      article.year, article.month, article.day, article.hour, article.minute,
      article.second
    );

    if (idx && this.y !== article.year) {
      article.isFirstInYear = true;
      articles[idx - 1].isLastInYear = true;
    }

    this.y = article.year;
  }, {
    y: true
  });
  articles[0].isFirstInYear = true;
  articles[articles.length - 1].isLastInYear = true;

  return articles;
}

function readMetadata(file, callback) {
  var metadata = extendObject({}, basicMetadata);

  fs.readFile(file, function (err, data) {
    metadata = extendObject(metadata, JSON.parse(data));

    switch (path.relative(templateDir, file).replace(/\\/g, "/")) {
    case "index.json":
      metadata.articles = readRSS(path.resolve(__dirname, blogFeed));
      metadata.articles.item.forEach(function (item) {
        var imgs = item["content:encoded"].match(/<img.*?>/g);

        if (imgs) {
          item.image = imgs.shift().replace(
            /src="https?:\/\/hail2u\.net/,
            'src="'
          );
          item.hasImage = true;
        }
      });
      metadata.articles.item[0].latest = true;
      metadata.updates = readRSS(path.resolve(__dirname, homeFeed));

      break;

    case "blog/index.json":
      metadata.articles = readArticles();

      break;
    }

    callback(metadata);
  });
}

if (argv.blog) {
  files = blogFiles;
} else {
  files = files.concat(blogFiles);
}

basicMetadata = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, metadataFile), "utf8")
);
mustache.escape = escape;
fs.readdirSync(partialDir).forEach(function (partial) {
  partials[path.basename(partial, ".mustache")] = fs.readFileSync(
    path.join(partialDir, partial),
    "utf8"
  );
});
eachLimit(files, cpuNum, function (file, next) {
  function processTemplate(data) {
    var html = mustache.render(
      fs.readFileSync(file.src, "utf8"),
      data,
      partials
    );

    if (!file.dest.endsWith(path.sep + "page")) {
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

    mkdirp.sync(path.dirname(file.dest));
    fs.writeFileSync(file.dest, html);
    next();
  }

  file.src = path.resolve(__dirname, file.src);

  if (!file.dest) {
    file.dest = path.join(
      "../dist/",
      path.dirname(path.relative(templateDir, file.src)),
      path.basename(file.src, ".mustache") + ".html"
    );
  }

  file.dest = path.resolve(__dirname, file.dest);
  readMetadata(
    path.join(
      path.dirname(file.src),
      path.basename(file.src, ".mustache") + ".json"
    ),
    processTemplate
  );
}, function (err) {
  if (err) {
    throw err;
  }
});
