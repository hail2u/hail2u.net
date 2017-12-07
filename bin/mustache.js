const formatDate = require("../lib/format-date");
const fs = require("fs-extra");
const minifyHTML = require("../lib/html-minifier");
const minimist = require("minimist");
const mustache = require("mustache");
const path = require("path");
const toPOSIXPath = require("../lib/to-posix-path");
const waterfall = require("../lib/waterfall");

const article = {
  json: "../src/blog/article.json",
  src: "../src/blog/article.mustache",
  type: "html"
};
const destDir = "../dist/";
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

const entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
const escapeRe = new RegExp(`[${Object.keys(entityMap)
  .join("")}]`, "g");
const escapeChar = (char) => entityMap[char];
const escapeString = (string) => String(string)
  .replace(escapeRe, escapeChar);
const readMetadata = () => new Promise((resolve, reject) => {
  fs.readJSON(metadataFile, "utf8", (e, o) => {
    if (e) {
      return reject(e);
    }

    resolve(o);
  });
});
const readItem = (itemFile) => new Promise((resolve, reject) => {
  fs.readJSON(itemFile, "utf8", (e, o) => {
    if (e) {
      return reject(e);
    }

    resolve(o);
  });
});
const flatten = (previous, current) => previous.concat(current);
const sortByDate = (a, b) => parseInt(a.unixtime, 10) -
  parseInt(b.unixtime, 10);
const findCover = (image, defaultCover) => {
  if (!image) {
    return defaultCover;
  }

  return image[1];
};
const argv = minimist(process.argv.slice(2), {
  boolean: [
    "articles",
    "feed",
    "html",
    "sitemap"
  ],
  string: ["file"]
});
const extendItem = (item, index, original) => {
  const cover = findCover(
    /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/.exec(item.body),
    item.cover
  );

  if (!argv.articles && !argv.file && item.body) {
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

  if (cover !== item.cover) {
    item.card_type = "summary_large_image";
    item.cover = cover;
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
};
const gatherItems = (items) => items.reduce(flatten)
  .sort(sortByDate)
  .reverse()
  .map(extendItem);
const readItems = () => Promise.all(itemFiles.map(readItem))
  .then(gatherItems);
const readPartial = (file) => new Promise((resolve, reject) => {
  fs.readFile(path.join(partialDir, file), "utf8", (e, d) => {
    if (e) {
      return reject(e);
    }

    const partial = {};

    partial[path.basename(file, ".mustache")] = d;
    resolve(partial);
  });
});
const gatherPartials = (partials) => Object.assign(...partials);
const readPartials = (partials) => Promise.all(partials.map(readPartial))
  .then(gatherPartials);
const readPartialDir = () => new Promise((resolve, reject) => {
  fs.readdir(partialDir, (e, f) => {
    if (e) {
      return reject(e);
    }

    resolve(f);
  });
})
  .then(readPartials);
const readTemplate = (file) => {
  if (file.template) {
    return file;
  }

  return new Promise((resolve, reject) => {
    fs.readFile(file.src, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      file.template = d;
      resolve(file);
    });
  });
};
const readExtradata = (file) => {
  if (file.extradata) {
    return file;
  }

  return new Promise((resolve, reject) => {
    fs.readJSON(file.json, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      file.extradata = o;
      resolve(file);
    });
  });
};
const pickByLink = (dest, item) => dest.endsWith(item.link);
const filterUpdates = (includeUpdates, item) => {
  if (item.link.startsWith("/blog/")) {
    return true;
  }

  if (includeUpdates) {
    return true;
  }

  return false;
};
const now = (date) => formatDate.rfc822(date.getDay(), date.getDate(),
  date.getMonth(), date.getFullYear(), date.getHours(), date.getMinutes(),
  date.getSeconds());
const mergeData = (file) => {
  if (argv.articles || argv.file) {
    file.extradata = Object.assign({}, file.extradata,
      file.items.find(pickByLink.bind(null, file.dest)));
    file.extradata.canonical = file.extradata.link;
    file.extradata.short_title = file.extradata.title;
  } else {
    file.extradata.items = file.items.concat()
      .filter(filterUpdates.bind(null, file.includeUpdates))
      .slice(0, file.itemLength);
  }

  file.extradata.lastBuildDate = now(new Date());
  file.data = Object.assign({}, file.metadata, file.extradata);

  return file;
};
const renderFile = (file) => {
  file.contents = mustache.render(file.template, file.data, file.partials);

  if (file.dest.endsWith(".html")) {
    file.contents = minifyHTML(file.contents);
  }

  return file;
};
const writeFile = (file) => new Promise((resolve, reject) => {
  fs.outputFile(file.dest, file.contents, (e) => {
    if (e) {
      return reject(e);
    }

    resolve(file);
  });
});
const build = (metadata, items, partials, file) => waterfall([
  readTemplate,
  readExtradata,
  mergeData,
  renderFile,
  writeFile
], Object.assign({
  items: items,
  metadata: metadata,
  partials: partials
}, file));
const refineByType = (file) => {
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
};
const mergeArticle = (file, item) => Object.assign({
  extradata: file.extradata,
  dest: toPOSIXPath(path.join(destDir, item.link)),
  template: file.template
}, article);
const generateArticleList = (items, file) =>
  items.filter(filterUpdates.bind(null, false))
    .map(mergeArticle.bind(null, file));
const toArticleList = (items) => waterfall([
  readTemplate,
  readExtradata,
  generateArticleList.bind(null, items)
], article);
const buildArticles = (metadata, items, partials, articles) =>
  Promise.all(articles.map(build.bind(null, metadata, items, partials)));
const buildAll = ([metadata, items, partials]) => {
  if (argv.file) {
    return build(metadata, items, partials, Object.assign({
      dest: argv.file
    }, article));
  }

  if (argv.articles) {
    return toArticleList(items)
      .then(buildArticles.bind(null, metadata, items, partials));
  }

  return Promise.all(files.filter(refineByType)
    .map(build.bind(null, metadata, items, partials)));
};

process.chdir(__dirname);
mustache.escape = escapeString;
Promise.all([
  readMetadata(),
  readItems(),
  readPartialDir()
])
  .then(buildAll)
  .catch((e) => {
    console.trace(e);
  });
