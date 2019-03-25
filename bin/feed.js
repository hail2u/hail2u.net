const { decode, encode } = require("../lib/html-entities");
const fs = require("fs").promises;
const mustache = require("mustache");
const path = require("path");
const { readJSONFile } = require("../lib/json");

const articlesFile = "../src/blog/articles.json";
const comicsFile = "../src/links/comics.json";
const specialsFile = "../src/documents/specials.json";
const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const files = [
  {
    dest: "../dist/blog/feed",
    json: "../src/blog/index.json",
    src: "../src/feed.mustache",
    type: ["article"]
  },
  {
    dest: "../dist/documents/feed",
    json: "../src/documents/index.json",
    src: "../src/feed.mustache",
    type: ["special"]
  },
  {
    dest: "../dist/feed",
    json: "../src/index.json",
    src: "../src/feed.mustache",
    type: ["article"]
  },
  {
    dest: "../dist/links/feed",
    json: "../src/links/index.json",
    src: "../src/feed.mustache",
    type: ["book", "webpage"]
  },
  {
    dest: "../dist/photos/feed",
    json: "../src/photos/index.json",
    src: "../src/feed.mustache",
    type: ["snapshot"]
  },
  {
    dest: "../dist/statuses/feed",
    json: "../src/statuses/index.json",
    src: "../src/feed.mustache",
    type: ["text"]
  }
];
const itemLength = 10;
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
const nonfictionsFile = "../src/links/nonfictions.json";
const novelsFile = "../src/links/novels.json";
const snapshotsDir = "../src/img/photos/";
const textsFile = "../src/statuses/texts.json";
const webpagesFile = "../src/links/webpages.json";

const extendArticle = article => {
  const description = decode(article.body
    .replace(/\r?\n/g, "")
    .replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
    .replace(/<.*?>/g, ""));
  return {
    ...article,
    body: article.body.replace(/(href|src)="(\/.*?)"/g, '$1="https://hail2u.net$2"'),
    description: description,
    type: "article"
  };
};

const readArticles = async () => {
  const articles = await readJSONFile(articlesFile);
  return articles.map(extendArticle);
};

const hasPublished = book => book.published;

const extendBook = book => {
  const image = `https://images-fe.ssl-images-amazon.com/images/P/${book.asin}.jpg`;
  return {
    ...book,
    body: `<p><img src="${image}"></p>`,
    description: image,
    link: `https://www.amazon.co.jp/exec/obidos/ASIN/${book.asin}/hail2unet-22`,
    type: "book"
  };
};

const readBooks = async file => {
  const books = await readJSONFile(file);
  return books
    .filter(hasPublished)
    .map(extendBook);
};

const isSnapshot = filename => {
  if (path.extname(filename) === ".jpg") {
    return true;
  }

  return false;
}

const extendSnapshot = snapshot => {
  const link = `/img/photos/${snapshot}`;
  const [year, month, date] = snapshot
    .replace(/\.jpg$/, "")
    .match(/(\d{4})(\d{2})(\d{2})/)
    .slice(1, 4);
  return {
    body: `<p><img src="https://hail2u.net${link}"></p>`,
    description: link,
    link: link,
    published: Date.parse(`${year}-${month}-${date}T00:00:00`),
    type: "snapshot"
  };
};

const hasValidDate = snapshot => !Number.isNaN(snapshot.published);

const listSnapshots = async () => {
  const snapshots = await fs.readdir(snapshotsDir);
  return snapshots
    .filter(isSnapshot)
    .map(extendSnapshot)
    .filter(hasValidDate);
};

const extendSpecial = special => ({
  ...special,
  description: special.link,
  type: "special"
});

const readSpecials = async () => {
  const specials = await readJSONFile(specialsFile);
  return specials.map(extendSpecial);
};

const extendText = text => ({
  ...text,
  description: text.text,
  link: `/statuses/#${text.published}`,
  type: "text"
});

const readTexts = async () => {
  const texts = await readJSONFile(textsFile);
  return texts.map(extendText);
};

const extendWebpage = webpage => ({
  ...webpage,
  description: webpage.url,
  link: webpage.url,
  type: "webpage"
});

const readWebpages = async () => {
  const webpages = await readJSONFile(webpagesFile);
  return webpages.map(extendWebpage);
};

const compareByUnixtime = (a, b) => Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const isValidType = (type, item) => {
  if (!type) {
    return true;
  }
  
  if (type.includes(item.type)) {
    return true;
  }

  return false;
}

const toAbsoluteURL = url => {
  if (url.startsWith("/")) {
    return `https://hail2u.net${url}`;
  }

  return url;
};

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
    hour: hour,
    link: toAbsoluteURL(item.link),
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

const now = date => `${dowNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} +0900`;

const mergeData = async (extradataFile, metadata, type) => {
  const extradata = await readJSONFile(extradataFile);
  return {
    ...metadata,
    ...extradata,
    items: metadata.items
      .filter(isValidType.bind(null, type))
      .slice(0, itemLength)
      .map(extendItem),
    lastBuildDate: now(new Date())
  };
};

const buildFeed = async (metadata, file) => {
  const [data, template] = await Promise.all([
    mergeData(file.json, metadata, file.type),
    fs.readFile(file.src, "utf8")
  ]);
  const rendered = mustache.render(template, data);
  await fs.writeFile(file.dest, rendered);
};

const main = async () => {
  const [
    metadata,
    articles,
    comics,
    nonfictions,
    novels,
    snapshots,
    specials,
    texts,
    webpages,
  ] = await Promise.all([
    readJSONFile(metadataFile),
    readArticles(),
    readBooks(comicsFile),
    readBooks(nonfictionsFile),
    readBooks(novelsFile),
    listSnapshots(),
    readSpecials(),
    readTexts(),
    readWebpages()
  ]);
  metadata.items = [
    ...articles,
    ...comics,
    ...nonfictions,
    ...novels,
    ...snapshots,
    ...specials,
    ...texts,
    ...webpages
  ].sort(compareByUnixtime);
  return Promise.all(files.map(buildFeed.bind(null, metadata)));
};

process.chdir(__dirname);
mustache.escape = encode;
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
