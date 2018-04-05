const { decode, encode } = require("../lib/html-entities");
const fs = require("fs-extra");
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
const files = [
  {
    dest: "../dist/about/index.html",
    json: "../src/about/index.json",
    src: "../src/about/index.mustache"
  },
  {
    dest: "../dist/blog/index.html",
    json: "../src/blog/index.json",
    src: "../src/blog/index.mustache"
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

const readItem = itempath => fs.readJSON(itempath, "utf8");

const compareByUnixtime = (a, b) =>
  Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

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
  const dt = new Date(item.published);
  const date = dt.getDate();
  const day = dt.getDay();
  const hour = dt.getHours();
  const minute = dt.getMinutes();
  const month = dt.getMonth() + 1;
  const second = dt.getSeconds();
  const year = dt.getFullYear();
  const datetimes = [day, date, month, year, hour, minute, second];
  return {
    ...item,
    date: date,
    day: day,
    description: decode(
      item.body
        .replace(/\r?\n/g, "")
        .replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
        .replace(/<.*?>/g, "")
    ),
    hour: hour,
    html5PubDate: toHTML5String(...datetimes),
    minute: minute,
    month: month,
    rfc822PubDate: toRFC822String(...datetimes),
    second: second,
    strPubDate: `${pad(month)}/${pad(date)}`,
    year: year
  };
};

const optimizeItems = items =>
  []
    .concat(...items)
    .sort(compareByUnixtime)
    .map(extendItem);

const readItems = async () => {
  const items = await Promise.all(itemFiles.map(readItem));
  return optimizeItems(items);
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

const isFirstInYear = (current, previous) => {
  if (!previous || current.year !== previous.year) {
    return true;
  }

  return false;
};

const isLastInYear = (current, next) => {
  if (!next || current.year !== next.year) {
    return true;
  }

  return false;
};

const isLatest = index => {
  if (index === 0) {
    return true;
  }

  return false;
};

const markYearChanges = (item, index, items) => {
  const nextItem = items[index + 1];
  const previousItem = items[index - 1];
  return {
    ...item,
    isFirstInYear: isFirstInYear(item, previousItem),
    isLastInYear: isLastInYear(item, nextItem),
    isLatest: isLatest(index)
  };
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

const mergeData = async (
  json,
  items,
  dest,
  metadata,
  includeUpdates,
  itemLength
) => {
  const extradata = await fs.readJSON(json, "utf8");

  if (argv.article || argv.articles) {
    const item = items.find(hasSameLink.bind(null, dest));
    const [cardType, cover] = findCover(
      /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/.exec(item.body),
      metadata.card_type,
      metadata.cover
    );
    return {
      ...metadata,
      ...extradata,
      ...item,
      canonical: item.link,
      card_type: cardType,
      cover: cover,
      short_title: item.title
    };
  }

  return {
    ...metadata,
    ...extradata,
    items: items
      .slice(0)
      .filter(filterUpdates.bind(null, includeUpdates))
      .map(markYearChanges)
      .slice(0, itemLength),
    lastBuildDate: now(new Date())
  };
};

const toAbsoluteURLinBody = item => ({
  ...item,
  body: item.body.replace(/(href|src)="(\/.*?)"/g, '$1="https://hail2u.net$2"')
});

const render = (template, data, partials, dest) => {
  if (dest.endsWith("/feed")) {
    const items = data.items.map(toAbsoluteURLinBody);
    return mustache.render(
      template,
      {
        ...data,
        items: items
      },
      partials
    );
  }

  return mustache.render(template, data, partials);
};

const buildDoc = async (metadata, items, partials, file) => {
  const [data, template] = await Promise.all([
    mergeData(
      file.json,
      items,
      file.dest,
      metadata,
      file.includeUpdates,
      file.itemLength
    ),
    fs.readFile(file.src, "utf8")
  ]);
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
    return buildDoc(metadata, items, partials, {
      dest: argv.article,
      json: articleJSON,
      src: articleSrc
    });
  }

  if (argv.articles) {
    const articles = await generateArticles(items);
    return Promise.all(
      articles.map(buildDoc.bind(null, metadata, items, partials))
    );
  }

  return Promise.all(files.map(buildDoc.bind(null, metadata, items, partials)));
};

process.chdir(__dirname);
mustache.escape = encode;
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
