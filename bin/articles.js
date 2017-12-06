const formatDate = require("../lib/format-date");
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
const entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
const extradataFile = "../src/blog/article.json";
const metadataFile = "../src/metadata.json";
const partialDir = "../src/partial/";
const rootDir = "../dist/";
const templateFile = "../src/blog/article.mustache";

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

function readExtradata() {
  return new Promise((resolve, reject) => {
    fs.readJSON(extradataFile, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      resolve(o);
    });
  });
}

function readCache() {
  return new Promise((resolve, reject) => {
    fs.readJSON(cacheFile, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      resolve(o);
    });
  });
}

function readTemplate() {
  return new Promise((resolve, reject) => {
    fs.readFile(templateFile, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve(d);
    });
  });
}

function readPartial(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(partialDir, file), "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve({
        [path.basename(file, ".mustache")]: d
      });
    });
  });
}

function flatten(previous, current) {
  return Object.assign(previous, current);
}

function gatherPartials(resolve, partials) {
  return resolve(partials.reduce(flatten));
}

function readPartials() {
  return new Promise((resolve, reject) => {
    fs.readdir(partialDir, (e, f) => {
      if (e) {
        return reject(e);
      }

      return Promise.all(f.map(readPartial))
        .then(gatherPartials.bind(null, resolve));
    });
  });
}

function findCover(image, defaultCover) {
  if (!image) {
    return defaultCover;
  }

  return image[1];
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
  data.html5PubDate = formatDate.html5(data.day, data.date, data.month,
    data.year, data.hour, data.minute, data.second);
  data.rfc822PubDate = formatDate.rfc822(data.day, data.date, data.month,
    data.year, data.hour, data.minute, data.second);
  data.strPubDate = `${formatDate.pad(data.month)}/${formatDate.pad(data.date)}`;
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
  readMetadata(),
  readExtradata(),
  readCache(),
  readTemplate(),
  readPartials()
])
  .then(buildAll)
  .catch((e) => {
    console.trace(e);
  });
