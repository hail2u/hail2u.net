const fs = require("fs-extra");
const minifyHTML = require("../lib/html-minifier");
const minimist = require("minimist");
const mustache = require("mustache");
const path = require("path");
const toPOSIXPath = require("../lib/to-posix-path");

const argv = minimist(process.argv.slice(2), {
  boolean: ["articles"],
  string: ["article"]
});
const articleJSON = "../src/blog/article.json";
const articleSrc = "../src/blog/article.mustache";
const destDir = "../dist/";
const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
const escapeRe = new RegExp(`[${Object.keys(entityMap).join("")}]`, "g");
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
const itemFiles = ["../src/blog/articles.json", "../src/updates.json"];
const metadataFile = "../src/metadata.json";
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
const partialDir = "../src/partial/";

const escapeChar = char => entityMap[char];

const escapeStr = str => String(str).replace(escapeRe, escapeChar);

const readJSON = filepath => fs.readJSON(filepath, "utf8");

const sortByDate = (a, b) =>
  parseInt(a.unixtime, 10) - parseInt(b.unixtime, 10);

const findCover = (image, defaultCardType, defaultCover) => {
  if (!image) {
    return [defaultCardType, defaultCover];
  }

  return ["summary_large_image", image[1]];
};

const pad = number => {
  if (number >= 10) {
    return number;
  }

  return `0${number}`;
};

const toHTML5Date = (day, date, month, year, hour, minute, second) =>
  `${year}-${pad(month)}-${pad(date)}T${pad(hour)}:${pad(minute)}:${pad(
    second
  )}+09:00`;

const toRFC822Date = (day, date, month, year, hour, minute, second) =>
  `${dowNames[day]}, ${date} ${monthNames[month - 1]} ${year} ${pad(
    hour
  )}:${pad(minute)}:${pad(second)} +0900`;

const extendItem = (item, index, items) => {
  const dt = new Date(item.unixtime);
  [item.card_type, item.cover] = findCover(
    /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/.exec(item.body),
    item.card_type,
    item.cover
  );
  item.date = dt.getDate();
  item.day = dt.getDay();
  item.hour = dt.getHours();
  item.minute = dt.getMinutes();
  item.month = dt.getMonth() + 1;
  item.second = dt.getSeconds();
  item.year = dt.getFullYear();
  item.html5PubDate = toHTML5Date(
    item.day,
    item.date,
    item.month,
    item.year,
    item.hour,
    item.minute,
    item.second
  );
  item.rfc822PubDate = toRFC822Date(
    item.day,
    item.date,
    item.month,
    item.year,
    item.hour,
    item.minute,
    item.second
  );
  item.strPubDate = `${pad(item.month)}/${pad(item.date)}`;
  item.body = item.body.replace(
    /(href|src)="(\/.*?)"/g,
    '$1="https://hail2u.net$2"'
  );
  item.description = item.body
    .replace(/\r?\n/g, "")
    .replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
    .replace(/<.*?>/g, "");

  if (index === 0) {
    item.isLatest = true;
    item.isFirstInYear = true;
    items[items.length - 1].isLastInYear = true;

    return item;
  }

  const previousItem = items[index - 1];

  if (item.year !== previousItem.year) {
    item.isFirstInYear = true;
    previousItem.isLastInYear = true;
  }

  return item;
};

const gatherItems = items =>
  []
    .concat(...items)
    .sort(sortByDate)
    .reverse()
    .map(extendItem);

const readItems = async () => {
  const items = await Promise.all(itemFiles.map(readJSON));
  return gatherItems(items);
};

const readFile = filepath => fs.readFile(filepath, "utf8");

const readPartial = async filename => ({
  [path.basename(filename, ".mustache")]: await readFile(
    path.join(partialDir, filename)
  )
});

const gatherPartials = partials => Object.assign(...partials);

const readPartials = async () => {
  const filenames = await fs.readdir(partialDir);
  const partials = await Promise.all(filenames.map(readPartial));
  return gatherPartials(partials);
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

const now = date =>
  toRFC822Date(
    date.getDay(),
    date.getDate(),
    date.getMonth() + 1,
    date.getFullYear(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );

const mergeData = file => {
  if (argv.article || argv.articles) {
    file.extradata = {
      ...file.extradata,
      ...file.items.find(pickByLink.bind(null, file.dest))
    };
    file.extradata.canonical = file.extradata.link;
    file.extradata.short_title = file.extradata.title;
  } else {
    file.extradata.items = file.items
      .concat()
      .filter(filterUpdates.bind(null, file.includeUpdates))
      .slice(0, file.itemLength);
  }

  file.extradata.lastBuildDate = now(new Date());
  return {
    ...file.metadata,
    ...file.extradata
  };
};

const renderFile = file =>
  mustache.render(file.template, file.data, file.partials);

const minifyContents = file => {
  if (!file.dest.endsWith(".html")) {
    return file.contents;
  }

  return minifyHTML(file.contents);
};

const writeFile = file => fs.outputFile(file.dest, file.contents);

const build = async (metadata, items, partials, file) => {
  const built = {
    ...{
      items: items,
      metadata: metadata,
      partials: partials
    },
    ...file
  };

  if (!built.template) {
    built.template = await readFile(built.src);
  }

  if (!built.extradata) {
    built.extradata = await readJSON(built.json);
  }

  built.data = await mergeData(built);
  built.contents = await renderFile(built);
  built.contents = await minifyContents(built);
  await writeFile(built);
};

const mergeArticle = (article, item) => ({
  ...article,
  ...{
    dest: toPOSIXPath(path.join(destDir, item.link))
  },
  ...item
});

const toArticleList = async items => {
  const article = {
    extradata: await readJSON(articleJSON),
    template: await readFile(articleSrc)
  };
  return items
    .filter(filterUpdates.bind(null, false))
    .map(mergeArticle.bind(null, article));
};

const main = async () => {
  const [metadata, items, partials] = await Promise.all([
    readJSON(metadataFile),
    readItems(),
    readPartials()
  ]);

  if (argv.article) {
    return build(metadata, items, partials, {
      dest: argv.article,
      json: articleJSON,
      src: articleSrc
    });
  }

  if (argv.articles) {
    const articles = await toArticleList(items);
    return Promise.all(
      articles.map(build.bind(null, metadata, items, partials))
    );
  }

  return Promise.all(files.map(build.bind(null, metadata, items, partials)));
};

process.chdir(__dirname);
mustache.escape = escapeStr;
main().catch(e => {
  console.trace(e);
});
