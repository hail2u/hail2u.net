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
var categoryNames = {
  "Blog": "blog",
  "Blosxom": "blosxom",
  "Coding": "coding",
  "Gadget": "gadget",
  "Game": "game",
  "Internet": "internet",
  "Media": "media",
  "Miscellaneous": "misc",
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
var dirTemplate = "src/html/";
var dirPartial = path.join(dirTemplate, "partial");
var entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
var files = [
  {
    src: "src/html/about/index.mustache"
  },
  {
    dest: "src/weblog/entries/themes/html/page",
    src: "src/html/blog/theme.mustache"
  },
  {
    src: "src/html/documents/index.mustache"
  },
  {
    src: "src/html/links/index.mustache"
  }
];
var filesBlog = [
  {
    src: "src/html/blog/index.mustache"
  },
  {
    src: "src/html/index.mustache"
  }
];
var metadataBase = JSON.parse(
  fs.readFileSync(dirTemplate + "metadata.json", "utf8")
);
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
  "Sep", "Oct", "Nov", "Dec"];
var monthNamesFull = ["January", "February", "March", "April", "May",
  "June", "July", "August", "September", "October", "November", "December"];
var partials = {};

var escape = function (str) {
  return String(str).replace(/[&<>"']/g, function (s) {
    return entityMap[s];
  });
};

var extendObject = function (dest, src) {
  var prop;

  if (dest !== Object(dest)) {
    return dest;
  }

  for (prop in src) {
    dest[prop] = src[prop];
  }

  return dest;
};

var loadRSS = function (file) {
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
    var hh;
    var nn;
    var ss;

    if (val.link) {
      val.link = val.link.replace(/https?:\/\/hail2u\.net\//, "/");
    }

    if (val.pubDate) {
      date = new Date(val.pubDate);
      yy = date.getFullYear();
      mm = date.getMonth();
      dd = date.getDate();
      hh = date.getHours();
      nn = date.getMinutes();
      ss = date.getSeconds();

      val.strPubDate = monthNames[mm] + " " + dd + ", " + yy;
      val.html5PubDate = sprintf(
        "%04d-%02d-%02dT%02d:%02d:%02d+09:00",
        yy, mm + 1, dd, hh, nn, ss
      );
    }

    if (val.category) {
      val.cat = categoryNames[val.category];
    }
  });

  return feed;
};

var loadArticles = function () {
  var articles = fs.readJsonSync("cache/articles.json");

  articles.forEach(function (article, i, a) {
    article.cat = article.link.replace(/^\/blog\/(.*?)\/.*$/, "$1");
    article.category = categoryNamesInv[article.cat];
    article.strPubDate = monthNamesFull[article.month - 1] + " " +
      article.day;
    article.html5PubDate = sprintf(
      "%04d-%02d-%02dT%02d:%02d:%02d+09:00",
      article.year, article.month, article.day, article.hour,
      article.minute, article.second
    );

    if (i > 0 && this.y !== article.year) {
      article.isFirstInYear = true;
      a[i - 1].isLastInYear = true;
    }

    this.y = article.year;
  }, {
    y: true
  });
  articles[0].isFirstInYear = true;
  articles[articles.length - 1].isLastInYear = true;

  return articles;
};

var loadBookmarks = function () {
  var bookmarks = fs.readJsonSync("cache/bookmarks.json");

  bookmarks.forEach(function (bookmark, i, a) {
    var category = "other";
    var date = new Date(bookmark.time);
    var tags = bookmark.tags;
    var year = date.getFullYear();

    if (tags.indexOf("instapaper") !== -1) {
      category = "instapaper";
    } else if (tags.indexOf("dribbble") !== -1) {
      category = "dribbble";
      bookmark.description = bookmark.description.replace(
        /^Dribbble - /,
        ""
      ).replace(
        / - Dribbble$/,
        ""
      );
    } else if (tags.indexOf("github") !== -1) {
      category = "github";
      bookmark.description = bookmark.extended.replace(
        /^hail2u starred /,
        ""
      );
    } else if (tags.indexOf("instagram") !== -1) {
      category = "instagram";
      bookmark.description = bookmark.href.replace(
        /^https?:\/\/(www\.)?instagram\.com\/p\//,
        ""
      ).replace(
        /\/$/,
        ""
      ).substr(0, 12);
    } else if (tags.indexOf("pinterest") !== -1) {
      category = "pinterest";
      bookmark.description = bookmark.extended;
    } else if (tags.indexOf("soundcloud") !== -1) {
      category = "soundcloud";
      bookmark.description = bookmark.extended;
    } else if (tags.indexOf("vimeo") !== -1) {
      category = "vimeo";
      bookmark.description = bookmark.description.replace(/ on Vimeo$/, "");
    } else if (bookmark.shared === "yes") {
      category = "pinboard";
    }

    bookmark.category = category;
    bookmark.date = monthNamesFull[date.getMonth()] + " " + date.getDate();
    bookmark.year = year;

    if (i > 0 && this.y !== year) {
      bookmark.isFirstInYear = true;
      a[i - 1].isLastInYear = true;
    }

    this.y = year;
  }, {
    y: 0
  });
  bookmarks[0].isFirstInYear = true;
  bookmarks[bookmarks.length - 1].isLastInYear = true;

  return bookmarks;
};

var extendData = function (file) {
  var data = extendObject({}, metadataBase);
  var fileMetadata = path.join(
    path.dirname(file),
    path.basename(file, ".mustache") + ".json"
  );
  var imgs;

  extendObject(data, fs.readJsonSync(fileMetadata));

  switch (file) {
  case "src/html/index.mustache":
    data.updates = loadRSS("src/index.rss");
    data.updates.item = data.updates.item.slice(0, 5);
    data.articles = loadRSS("dist/blog/feed");
    data.articles.item = data.articles.item.slice(0, 6);
    data.articles.first = data.articles.item.shift();
    imgs = data.articles.first["content:encoded"].match(/<img.*?>/g);

    if (imgs) {
      data.articles.first.image = imgs[0].replace(
        /src="https?:\/\/hail2u\.net/,
        'src="'
      );
      data.articles.first.hasImage = true;
    }

    break;

  case "src/html/blog/index.mustache":
    data.articles = loadArticles();

    break;

  case "src/html/links/index.mustache":
    data.bookmarks = loadBookmarks();

    break;
  }

  return data;
};

if (argv.blog) {
  files = filesBlog;
} else {
  files = files.concat(filesBlog);
}

mustache.escape = escape;
fs.readdirSync(dirPartial).forEach(function (partial) {
  partials[path.basename(partial, ".mustache")] = fs.readFileSync(
    path.join(dirPartial, partial),
    "utf8"
  );
});
files.forEach(function (file) {
  var fileTemplate = file.src;
  var html;

  if (!file.dest) {
    file.dest = path.join(
      "dist",
      path.dirname(path.relative("src/html", file.src)),
      path.basename(file.src, ".mustache") + ".html"
    );
  }

  html = mustache.render(
    fs.readFileSync(fileTemplate, "utf8"),
    extendData(fileTemplate),
    partials
  );

  if (file.dest.lastIndexOf("/page") === -1) {
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
});
