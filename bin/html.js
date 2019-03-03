const { decode, encode } = require("../lib/html-entities");
const fs = require("fs").promises;
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
    dest: "../dist/blog/index.html",
    json: "../src/blog/index.json",
    src: "../src/blog/index.mustache"
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
    itemLength: 5,
    src: "../src/index.mustache"
  },
  {
    dest: "../dist/sitemap.xml",
    json: "../src/index.json",
    src: "../src/sitemap.mustache"
  }
];
const itemFile = "../src/blog/articles.json";
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

const readJSONFile = async file => {
  const json = await fs.readFile(file, "utf8");
  return JSON.parse(json);
};

const compareByUnixtime = (a, b) =>
  Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const pad = number => String(number).padStart(2, "0");

const extendItem = item => {
  const dt = new Date(item.published);
  const date = dt.getDate();
  const day = dt.getDay();
  const hour = dt.getHours();
  const minute = dt.getMinutes();
  const month = dt.getMonth() + 1;
  const second = dt.getSeconds();
  const year = dt.getFullYear();
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
    minute: minute,
    month: month,
    second: second,
    strDate: pad(date),
    strDowName: dowNames[day],
    strHour: pad(hour),
    strMinute: pad(minute),
    strMonth: pad(month),
    strMonthName: monthNames[month - 1],
    strSecond: pad(second),
    strYear: pad(year),
    year: year
  };
};

const readItems = async () => {
  const items = await readJSONFile(itemFile);
  return items.sort(compareByUnixtime).map(extendItem);
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

const findCover = (image, defaultCardType, defaultCover) => {
  if (!image) {
    return [defaultCardType, defaultCover];
  }

  return ["summary_large_image", image[1]];
};

const isFirstInMonth = (current, previous) => {
  if (!previous || current.month !== previous.month) {
    return true;
  }

  return false;
};

const isFirstInYear = (current, previous) => {
  if (!previous || current.year !== previous.year) {
    return true;
  }

  return false;
};

const isLastInMonth = (current, next) => {
  if (!next || current.month !== next.month) {
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

const markItemChanges = (item, index, items) => {
  const nextItem = items[index + 1];
  const previousItem = items[index - 1];
  return {
    ...item,
    isFirstInMonth: isFirstInMonth(item, previousItem),
    isFirstInYear: isFirstInYear(item, previousItem),
    isLastInMonth: isLastInMonth(item, nextItem),
    isLastInYear: isLastInYear(item, nextItem),
    isLatest: isLatest(index)
  };
};

const now = date =>
  `${dowNames[date.getDay()]}, ${date.getDate()} ${
    monthNames[date.getMonth()]
  } ${date.getFullYear()} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())} +0900`;

const mergeData = async (
  extradataFile,
  items,
  dest,
  metadata,
  includeUpdates,
  itemLength
) => {
  const extradata = await readJSONFile(extradataFile);

  if (extradata.books) {
    extradata.books = extradata.books.reverse().slice(0, 5);
  }

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
      .map(markItemChanges)
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
  await fs.writeFile(file.dest, rendered);
};

const mergeArticle = item => ({
  dest: toPOSIXPath(path.join(destDir, item.link)),
  json: articleJSON,
  src: articleSrc,
  ...item
});

const main = async () => {
  const [metadata, items, partials] = await Promise.all([
    readJSONFile(metadataFile),
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
    const articles = await Promise.all(items.map(mergeArticle));
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
