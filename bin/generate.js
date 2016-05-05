#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");
var minifyHTML = require("html-minifier").minify;
var minimist = require("minimist");
var mustache = require("mustache");
var parseXML = require("xml2js").parseString;
var path = require("path");
var sprintf = require("sprintf").sprintf;

var argv = minimist(process.argv.slice(2), {
  boolean: ["blog"]
});
var articlesCache = "../cache/articles.json";
var basicMetadata;
var blogFeed = "../dist/blog/feed";
var blogFiles = [
  {
    src: "../src/html/blog/index.mustache"
  },
  {
    src: "../src/html/index.mustache"
  }
];
var categoryNames = {
  "Blog": "blog",
  "Blosxom": "blosxom",
  "Coding": "coding",
  "Gadget": "gadget",
  "Game": "game",
  "Internet": "internet",
  "Media": "media",
  "Misc.": "misc",
  "RSS": "rss",
  "Software": "software",
  "Sports": "sports",
  "Web Design": "webdesign"
};
var categoryNamesInv = (function (obj) {
  var newObj = {};
  var prop;

  for (prop in obj) {
    newObj[obj[prop]] = prop;
  }

  return newObj;
})(categoryNames);
var entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
var files = [
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
var homeFeed = "../src/index.rss";
var metadataFile = "../src/html/metadata.json";
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
  "Sep", "Oct", "Nov", "Dec"];
var monthNamesFull = ["January", "February", "March", "April", "May",
  "June", "July", "August", "September", "October", "November", "December"];
var partialDir = "../src/html/partial";
var partials = {};
var templateDir = "../src/html/";

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
      val.strPubDate = monthNames[mm] + " " + dd + ", " + yy;
      val.html5PubDate = sprintf(
        "%04d-%02d-%02dT%02d:%02d:%02d+09:00",
        yy, mm + 1, dd, date.getHours(), date.getMinutes(), date.getSeconds()
      );
    }

    if (val.category) {
      val.cat = categoryNames[val.category];
    }
  });

  return feed;
}

function readArticles() {
  var articles = fs.readJsonSync(path.resolve(__dirname, articlesCache));

  articles.forEach(function (article, idx) {
    article.cat = article.link.replace(/^\/blog\/(.*?)\/.*$/, "$1");
    article.category = categoryNamesInv[article.cat];
    article.strPubDate = monthNamesFull[article.month - 1] + " " +
      article.day;
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

  fs.readJson(file, function (err, data) {
    metadata = extendObject(metadata, data);

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
      metadata.articles.first = metadata.articles.item.shift();
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
partialDir = path.join(__dirname, partialDir);
templateDir = path.resolve(__dirname, templateDir);
fs.readdirSync(partialDir).forEach(function (partial) {
  partials[path.basename(partial, ".mustache")] = fs.readFileSync(
    path.join(partialDir, partial),
    "utf8"
  );
});
files.forEach(function (file) {
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

    fs.outputFileSync(file.dest, html);
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
});
