#!/usr/bin/env node

"use strict";

const fs = require("fs-extra");
const minifyHTML = require("../lib/html-minifier");
const mustache = require("mustache");
const parseXML = require("xml2js").parseString;
const path = require("path");
const waterfall = require("../lib/waterfall");

const articleCache = "../cache/articles.json";
const dir = {
  partial: "../src/html/partial",
  template: "../src/html/"
};
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
    dest: "../dist/index.html",
    src: "../src/html/index.mustache"
  }
];
const entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
const metadataFile = "../src/html/metadata.json";
const weblogFeed = "../dist/blog/feed";

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

function readPartial(file) {
  file = path.join(dir.partial, file);

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

function gatherPartials(resolve, metadata, partials) {
  return resolve([metadata, partials.reduce((a, v) => {
    return Object.assign(a, v);
  })]);
}

function readPartials(metadata) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir.partial, (e, f) => {
      if (e) {
        return reject(e);
      }

      return Promise.all(f.map(readPartial))
        .then(gatherPartials.bind(null, resolve, metadata));
    });
  });
}

function readTemplate([metadata, partials, file]) {
  return new Promise((resolve, reject) => {
    fs.readFile(file.src, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      file.template = d;
      resolve([metadata, partials, file]);
    });
  });
}

function readData([metadata, partials, file]) {
  return new Promise((resolve, reject) => {
    fs.readJSON(file.json, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      file.data = Object.assign({}, metadata, o);
      resolve([partials, file]);
    });
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

function getItems(feed) {
  return new Promise((resolve, reject) => {
    parseXML(feed, {
      async: true,
      trim: true,
      explicitArray: false
    }, (e, o) => {
      if (e) {
        return reject(e);
      }

      const items = o.rss.channel.item.map((i) => {
        if (i.link) {
          i.link = i.link.replace(/https?:\/\/hail2u\.net\//, "/");
        }

        if (i.pubDate) {
          const dt = new Date(i.pubDate);
          const yy = dt.getFullYear();
          const mm = dt.getMonth() + 1;
          const dd = dt.getDate();

          i.strPubDate = `${yy}/${pad(mm)}/${pad(dd)}`;
          i.html5PubDate = toHTML5Date(yy, mm, dd, dt.getHours(),
            dt.getMinutes(), dt.getSeconds());
        }

        return i;
      });

      items[0].isLatest = true;
      resolve(items);
    });
  });
}

function readWeblogFeed([partials, file]) {
  if (!file.data.home) {
    return [partials, file, null];
  }

  return new Promise((resolve, reject) => {
    fs.readFile(weblogFeed, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve(d);
    });
  }).then(getItems)
    .then((i) => {
      file.data.articles = i;

      return [partials, file];
    });
}

function readArticlesCache([partials, file]) {
  if (!file.data.weblog || file.data.weblog_child) {
    return [partials, file];
  }

  return new Promise((resolve, reject) => {
    fs.readJSON(articleCache, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      o.map(function (a, idx, arr) {
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

      o[0].isFirstInYear = true;
      o[o.length - 1].isLastInYear = true;
      file.data.articles = o;
      resolve([partials, file]);
    });
  });
}

function render([partials, file]) {
  file.contents = mustache.render(file.template, file.data, partials);

  return file;
}

function minify(file) {
  if (!file.dest.endsWith("/page")) {
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

function build(metadata, partials, file) {
  file.json = path.join(path.dirname(file.src), `${path.basename(file.src, ".mustache")}.json`);

  return waterfall([
    readTemplate,
    readData,
    readWeblogFeed,
    readArticlesCache,
    render,
    minify,
    write
  ], [metadata, partials, file]);
}

function buildAll([metadata, partials]) {
  return Promise.all(files.map(build.bind(null, metadata, partials)));
}

process.chdir(__dirname);
mustache.escape = (s) => {
  return String(s).replace(/[&<>"']/g, (c) => {
    return entityMap[c];
  });
};
waterfall([
  readMetadata,
  readPartials,
  buildAll
]).catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
