const { decode, encode } = require("../lib/html-entities");
const fs = require("fs").promises;
const mustache = require("mustache");
const path = require("path");
const { readJSONFile } = require("../lib/json");

const articlesFile = "../src/blog/articles.json";
const comicsFile = "../src/bookshelf/comics.json";
const documentsFile = "../src/documents/documents.json";
const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const files = [
  {
    dest: "../dist/bookshelf/feed",
    json: "../src/bookshelf/index.json",
    src: "../src/feed.mustache",
    type: ["book"]
  },
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
    type: ["document"]
  },
  {
    dest: "../dist/feed",
    json: "../src/index.json",
    src: "../src/feed.mustache"
  },
  {
    dest: "../dist/links/feed",
    json: "../src/links/index.json",
    src: "../src/feed.mustache",
    type: ["link"]
  },
  {
    dest: "../dist/photos/feed",
    json: "../src/photos/index.json",
    src: "../src/feed.mustache",
    type: ["photo"]
  },
  {
    dest: "../dist/statuses/feed",
    json: "../src/statuses/index.json",
    src: "../src/feed.mustache",
    type: ["status"]
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
const nonfictionsFile = "../src/bookshelf/nonfictions.json";
const novelsFile = "../src/bookshelf/novels.json";
const photosDir = "../src/img/photos/";
const statusesFile = "../src/statuses/statuses.json";
const linksFile = "../src/links/links.json";

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
  return articles
    .slice(0, itemLength)
    .map(extendArticle);
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
    .slice(0, itemLength)
    .map(extendBook);
};

const extendDocument = document => ({
  ...document,
  description: document.link,
  type: "document"
});

const readDocuments = async () => {
  const documents = await readJSONFile(documentsFile);
  return documents
    .slice(0, itemLength)
    .map(extendDocument);
};

const extendLink = link => ({
  ...link,
  description: link.url,
  link: link.url,
  type: "link"
});

const readLinks = async () => {
  const links = await readJSONFile(linksFile);
  return links
    .slice(0, itemLength)
    .map(extendLink);
};

const isPhoto = filename => {
  if (path.extname(filename) === ".jpg") {
    return true;
  }

  return false;
};

const getPhotoDatetime = photo => {
  const dt = path.basename(photo, ".jpg").split("");
  return Date.parse(`${dt[0]}${dt[1]}${dt[2]}${dt[3]}-${dt[4]}${dt[5]}-${dt[6]}${dt[7]}T${dt[8]}${dt[9]}:${dt[10]}${dt[11]}:${dt[12]}${dt[13]}`);
};

const extendPhoto = photo => {
  const link = `/img/photos/${photo}`;
  return {
    body: `<p><img src="https://hail2u.net${link}"></p>`,
    description: link,
    link: link,
    published: getPhotoDatetime(photo),
    type: "photo"
  };
};

const hasValidDate = photo => !Number.isNaN(photo.published);

const listPhotos = async () => {
  const photos = await fs.readdir(photosDir);
  return photos
    .filter(isPhoto)
    .sort()
    .reverse()
    .slice(0, itemLength)
    .map(extendPhoto)
    .filter(hasValidDate);
};

const extendStatus = status => ({
  ...status,
  description: status.text,
  link: `/statuses/#on-${status.published}`,
  type: "status"
});

const readStatuses = async () => {
  const statuses = await readJSONFile(statusesFile);
  return statuses
    .slice(0, itemLength)
    .map(extendStatus);
};

const compareByPublished = (a, b) =>
  Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const isValidType = (type, item) => {
  if (!type) {
    return true;
  }

  if (type.includes(item.type)) {
    return true;
  }

  return false;
};

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
    documents,
    links,
    nonfictions,
    novels,
    photos,
    statuses
  ] = await Promise.all([
    readJSONFile(metadataFile),
    readArticles(),
    readBooks(comicsFile),
    readDocuments(),
    readLinks(),
    readBooks(nonfictionsFile),
    readBooks(novelsFile),
    listPhotos(),
    readStatuses()
  ]);
  metadata.items = [
    ...articles,
    ...comics,
    ...documents,
    ...links,
    ...nonfictions,
    ...novels,
    ...photos,
    ...statuses
  ].sort(compareByPublished);
  return Promise.all(files.map(buildFeed.bind(null, metadata)));
};

process.chdir(__dirname);
mustache.escape = encode;
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
