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
    src: "../src/about/index.mustache"
  },
  {
    dest: "../dist/blog/feed",
    json: "../src/blog/index.json",
    itemLength: 10,
    src: "../src/blog/feed.mustache"
  },
  {
    dest: "../dist/blog/index.html",
    json: "../src/blog/index.json",
    src: "../src/blog/index.mustache"
  },
  {
    dest: "../src/blosxom/entries/themes/html/page",
    json: "../src/blog/theme.json",
    src: "../src/blog/theme.mustache"
  },
  {
    dest: "../dist/documents/index.html",
    json: "../src/documents/index.json",
    src: "../src/documents/index.mustache"
  },
  {
    dest: "../dist/projects/index.html",
    json: "../src/projects/index.json",
    src: "../src/projects/index.mustache"
  },
  {
    dest: "../dist/feed",
    json: "../src/index.json",
    itemLength: 10,
    src: "../src/feed.mustache"
  },
  {
    dest: "../dist/index.html",
    json: "../src/index.json",
    includeUpdates: true,
    itemLength: 10,
    src: "../src/index.mustache"
  },
  {
    dest: "../dist/sitemap.xml",
    json: "../src/index.json",
    src: "../src/sitemap.mustache"
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

const readItem = itempath => fs.readJSON(itempath, "utf8");

const compareByUnixtime = (a, b) =>
  parseInt(b.unixtime, 10) - parseInt(a.unixtime, 10);

const pad = number => {
  if (number >= 10) {
    return number;
  }

  return `0${number}`;
};

const toHTML5String = (day, date, month, year, hour, minute, second) =>
  `${year}-${pad(month)}-${pad(date)}T${pad(hour)}:${pad(minute)}:${pad(
    second
  )}+09:00`;

const toRFC822String = (day, date, month, year, hour, minute, second) =>
  `${dowNames[day]}, ${date} ${monthNames[month - 1]} ${year} ${pad(
    hour
  )}:${pad(minute)}:${pad(second)} +0900`;

const extendItem = item => {
  const dt = new Date(item.unixtime);
  const extension = {
    body: item.body.replace(
      /(href|src)="(\/.*?)"/g,
      '$1="https://hail2u.net$2"'
    ),
    date: dt.getDate(),
    day: dt.getDay(),
    description: item.body
      .replace(/\r?\n/g, "")
      .replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
      .replace(/<.*?>/g, ""),
    hour: dt.getHours(),
    minute: dt.getMinutes(),
    month: dt.getMonth() + 1,
    second: dt.getSeconds(),
    year: dt.getFullYear()
  };
  extension.html5PubDate = toHTML5String(
    extension.day,
    extension.date,
    extension.month,
    extension.year,
    extension.hour,
    extension.minute,
    extension.second
  );
  extension.rfc822PubDate = toRFC822String(
    extension.day,
    extension.date,
    extension.month,
    extension.year,
    extension.hour,
    extension.minute,
    extension.second
  );
  extension.strPubDate = `${pad(extension.month)}/${pad(extension.date)}`;
  return {
    ...item,
    ...extension
  };
};

const markYearChanges = (item, index, items) => {
  const nextItem = items[index + 1];
  const previousItem = items[index - 1];
  const yearMarker = {
    isFirstInYear: false,
    isLastInYear: false,
    isLatest: false
  };

  if (index === 0) {
    yearMarker.isFirstInYear = true;
    yearMarker.isLatest = true;
  }

  if (nextItem && item.year !== nextItem.year) {
    yearMarker.isLastInYear = true;
  }

  if (previousItem && item.year !== previousItem.year) {
    yearMarker.isFirstInYear = true;
  }

  if (index === items.length - 1) {
    yearMarker.isLastInYear = true;
  }

  return {
    ...item,
    ...yearMarker
  };
};

const readItems = async () => {
  let items = await Promise.all(itemFiles.map(readItem));
  items = [].concat(...items).sort(compareByUnixtime);
  items = await Promise.all(items.map(extendItem));
  return Promise.all(items.map(markYearChanges));
};

const readPartial = async filename => ({
  [path.basename(filename, ".mustache")]: await fs.readFile(
    path.join(partialDir, filename),
    "utf8"
  )
});

const gatherPartials = partials => Object.assign(...partials);

const readPartials = async () => {
  const filenames = await fs.readdir(partialDir);
  const partials = await Promise.all(filenames.map(readPartial));
  return gatherPartials(partials);
};

const hasSameLink = (dest, item) => dest.endsWith(item.link);

const filterUpdates = (includeUpdates, item) => {
  if (item.link.startsWith("/blog/")) {
    return true;
  }

  if (includeUpdates) {
    return true;
  }

  return false;
};

const findCover = (image, defaultCardType, defaultCover) => {
  if (!image) {
    return [defaultCardType, defaultCover];
  }

  return ["summary_large_image", image[1]];
};

const now = date =>
  toRFC822String(
    date.getDay(),
    date.getDate(),
    date.getMonth() + 1,
    date.getFullYear(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );

const mergeData = (
  extradata,
  items,
  dest,
  metadata,
  includeUpdates,
  itemLength
) => {
  if (argv.article || argv.articles) {
    const data = {
      ...extradata,
      ...items.find(hasSameLink.bind(null, dest))
    };
    data.canonical = data.link;
    [data.card_type, data.cover] = findCover(
      /<img\s.*?\bsrc="https:\/\/hail2u\.net(\/img\/blog\/.*?)"/.exec(
        data.body
      ),
      metadata.card_type,
      metadata.cover
    );
    data.short_title = data.title;
    return {
      ...metadata,
      ...data
    };
  }

  return {
    ...metadata,
    ...extradata,
    items: items
      .slice(0)
      .filter(filterUpdates.bind(null, includeUpdates))
      .slice(0, itemLength),
    lastBuildDate: now(new Date())
  };
};

const render = (template, data, partials, dest) => {
  const rendered = mustache.render(template, data, partials);

  if (dest.endsWith(".html")) {
    return minifyHTML(rendered).replace(
      /(href|src)="https:\/\/hail2u\.net(\/.*?)"/g,
      '$1="$2"'
    );
  }

  return rendered;
};

const build = async (metadata, items, partials, file) => {
  const [template, extradata] = await Promise.all([
    fs.readFile(file.src, "utf8"),
    fs.readJSON(file.json, "utf8")
  ]);
  const data = await mergeData(
    extradata,
    items,
    file.dest,
    metadata,
    file.includeUpdates,
    file.itemLength
  );
  const rendered = await render(template, data, partials, file.dest);
  await fs.outputFile(file.dest, rendered);
};

const mergeArticle = item => ({
  dest: toPOSIXPath(path.join(destDir, item.link)),
  json: articleJSON,
  src: articleSrc,
  ...item
});

const generateArticles = items => {
  const articles = items.filter(filterUpdates.bind(null, false));
  return Promise.all(articles.map(mergeArticle));
};

const main = async () => {
  const [metadata, items, partials] = await Promise.all([
    fs.readJSON(metadataFile, "utf8"),
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
    const articles = await generateArticles(items);
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
