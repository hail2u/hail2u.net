const formatDate = require("../lib/format-date");
const fs = require("fs-extra");
const minifyHTML = require("../lib/html-minifier");
const minimist = require("minimist");
const mustache = require("mustache");
const path = require("path");
const waterfall = require("../lib/waterfall");

const argv = minimist(process.argv.slice(2), {
  boolean: [
    "feed",
    "html",
    "sitemap"
  ],
  string: ["file"]
});
const article = {
  json: "../src/blog/article.json",
  src: "../src/blog/article.mustache",
  type: "html"
};
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
    src: "../src/about/index.mustache",
    type: "html"
  },
  {
    dest: "../dist/blog/feed",
    json: "../src/blog/index.json",
    itemLength: 10,
    src: "../src/blog/feed.mustache",
    type: "feed"
  },
  {
    dest: "../dist/blog/index.html",
    json: "../src/blog/index.json",
    src: "../src/blog/index.mustache",
    type: "html"
  },
  {
    dest: "../src/blosxom/entries/themes/html/page",
    json: "../src/blog/theme.json",
    src: "../src/blog/theme.mustache",
    type: "html"
  },
  {
    dest: "../dist/documents/index.html",
    json: "../src/documents/index.json",
    src: "../src/documents/index.mustache",
    type: "html"
  },
  {
    dest: "../dist/projects/index.html",
    json: "../src/projects/index.json",
    src: "../src/projects/index.mustache",
    type: "html"
  },
  {
    dest: "../dist/feed",
    json: "../src/index.json",
    itemLength: 10,
    src: "../src/feed.mustache",
    type: "feed"
  },
  {
    dest: "../dist/index.html",
    json: "../src/index.json",
    includeUpdates: true,
    itemLength: 10,
    src: "../src/index.mustache",
    type: "html"
  },
  {
    dest: "../dist/sitemap.xml",
    json: "../src/index.json",
    src: "../src/sitemap.mustache",
    type: "sitemap"
  }
];
const itemFiles = [
  "../src/blog/articles.json",
  "../src/updates.json"
];
const metadataFile = "../src/metadata.json";
const partialDir = "../src/partial/";

function readData(file) {
  return new Promise((resolve, reject) => {
    fs.readJSON(file, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      resolve(o);
    });
  });
}

function flatten(previous, current) {
  return previous.concat(current);
}

function sortByDate(a, b) {
  return parseInt(a.unixtime, 10) - parseInt(b.unixtime, 10);
}

function extendItem(item, index, original) {
  if (item.body) {
    item.body = item.body.replace(/(href|src)="(\/.*?)"/g, "$1=\"https://hail2u.net$2\"");
  }

  if (!item.description) {
    item.description = item.body.replace(/\r?\n/g, "")
      .replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
      .replace(/<.*?>/g, "");
  }

  if (!item.date) {
    const dt = new Date(item.unixtime);

    item.date = dt.getDate();
    item.day = dt.getDay();
    item.hour = dt.getHours();
    item.minute = dt.getMinutes();
    item.month = dt.getMonth() + 1;
    item.second = dt.getSeconds();
    item.year = dt.getFullYear();
  }

  item.html5PubDate = formatDate.html5(item.day, item.date, item.month,
    item.year, item.hour, item.minute, item.second);
  item.rfc822PubDate = formatDate.rfc822(item.day, item.date, item.month,
    item.year, item.hour, item.minute, item.second);
  item.strPubDate = `${formatDate.pad(item.month)}/${formatDate.pad(item.date)}`;

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

function gatherItems(items) {
  items = items.reduce(flatten)
    .sort(sortByDate)
    .reverse()
    .map(extendItem);

  return items;
}

function readItems() {
  return Promise.all(itemFiles.map(readData))
    .then(gatherItems);
}

function readPartial(file) {
  file = path.join(partialDir, file);

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

function readPartials() {
  return new Promise((resolve, reject) => {
    fs.readdir(partialDir, (e, f) => {
      if (e) {
        return reject(e);
      }

      return Promise.all(f.map(readPartial))
        .then((o) => {
          return resolve(o.reduce((a, v) => {
            return Object.assign(a, v);
          }));
        });
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

function pickupByLink(item) {
  return argv.file.endsWith(item.link);
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

function now(date) {
  return formatDate.rfc822(date.getDay(), date.getDate(), date.getMonth(),
    date.getFullYear(), date.getHours(), date.getMinutes(), date.getSeconds());
}

function mergeData([metadata, items, partials, file]) {
  return readData(file.json)
    .then((extradata) => {
      if (argv.file) {
        Object.assign(extradata, items[items.findIndex(pickupByLink)]);
        extradata.canonical = extradata.link;
        extradata.short_title = extradata.title;
      } else {
        extradata.items = items.concat()
          .filter(filterUpdates.bind(null, file.includeUpdates))
          .slice(0, file.itemLength);
      }

      extradata.lastBuildDate = now(new Date());
      file.data = Object.assign({}, metadata, extradata);

      return [partials, file];
    });
}

function renderFile([partials, file]) {
  file.contents = mustache.render(file.template, file.data, partials);

  if (file.dest.endsWith(".html")) {
    file.contents = minifyHTML(file.contents);
  }

  return file;
}

function writeFile(file) {
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
    renderFile,
    writeFile
  ], [metadata, items, partials, file]);
}

function refineByType(file) {
  if (!argv.feed && !argv.html && !argv.sitemap) {
    return true;
  }

  if (argv.feed && file.type === "feed") {
    return true;
  }

  if (argv.html && file.type === "html") {
    return true;
  }

  if (argv.sitemap && file.type === "sitemap") {
    return true;
  }

  return false;
}

function buildAll([metadata, items, partials]) {
  if (argv.file) {
    return build(metadata, items, partials, Object.assign({
      dest: argv.file
    }, article));
  }

  return Promise.all(files.filter(refineByType)
    .map(build.bind(null, metadata, items, partials)));
}

process.chdir(__dirname);
mustache.escape = (s) => {
  return String(s)
    .replace(/[&<>"']/g, (c) => {
      return entityMap[c];
    });
};
Promise.all([
  readData(metadataFile),
  readItems(),
  readPartials()
])
  .then(buildAll)
  .catch((e) => {
    console.trace(e);
  });
