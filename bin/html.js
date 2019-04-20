const { decode, encode } = require("../lib/html-entities");
const fs = require("fs").promises;
const minimist = require("minimist");
const mustache = require("mustache");
const path = require("path");
const { readJSONFile } = require("../lib/json");
const toPOSIXPath = require("../lib/to-posix-path");

const argv = minimist(process.argv.slice(2), {
  alias: {
    A: "all",
    a: "article"
  },
  boolean: ["all"],
  string: ["article"]
});
const articleJSON = "../src/blog/article.json";
const articleSrc = "../src/blog/article.mustache";
const articlesFile = "../src/blog/articles.json";
const comicsFile = "../src/links/comics.json";
const destDir = "../dist/";
const documentsFile = "../src/documents/documents.json";
const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const files = [
  {
    dest: "../dist/blog/index.html",
    json: "../src/blog/index.json",
    src: "../src/blog/index.mustache"
  },
  {
    dest: "../dist/blog/log.html",
    isLog: true,
    json: "../src/blog/index.json",
    src: "../src/blog/log.mustache"
  },
  {
    dest: "../dist/documents/index.html",
    isLog: true,
    json: "../src/documents/index.json",
    src: "../src/documents/index.mustache"
  },
  {
    dest: "../dist/index.html",
    json: "../src/index.json",
    src: "../src/index.mustache"
  },
  {
    dest: "../dist/links/index.html",
    json: "../src/links/index.json",
    src: "../src/links/index.mustache"
  },
  {
    dest: "../dist/links/log.html",
    isLog: true,
    json: "../src/links/index.json",
    src: "../src/links/log.mustache"
  },
  {
    dest: "../dist/photos/index.html",
    json: "../src/photos/index.json",
    src: "../src/photos/index.mustache"
  },
  {
    dest: "../dist/photos/log.html",
    isLog: true,
    json: "../src/photos/index.json",
    src: "../src/photos/log.mustache"
  },
  {
    dest: "../dist/sitemap.xml",
    isLog: true,
    json: "../src/sitemap.json",
    src: "../src/sitemap.mustache"
  },
  {
    dest: "../dist/statuses/index.html",
    json: "../src/statuses/index.json",
    src: "../src/statuses/index.mustache"
  },
  {
    dest: "../dist/statuses/log.html",
    isLog: true,
    json: "../src/statuses/index.json",
    src: "../src/statuses/log.mustache"
  }
];
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
const partialDir = "../src/partial/";
const photosDir = "../src/img/photos/";
const statusesFile = "../src/statuses/statuses.json";
const linksFile = "../src/links/links.json";

const pad = number => String(number).padStart(2, "0");

const expandDatetime = unixtime => {
  const dt = new Date(unixtime);
  const date = dt.getDate();
  const day = dt.getDay();
  const hour = dt.getHours();
  const minute = dt.getMinutes();
  const month = dt.getMonth() + 1;
  const second = dt.getSeconds();
  const year = dt.getFullYear();
  return {
    date: date,
    day: day,
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

const extendArticle = article => {
  const dt = expandDatetime(article.published);
  const description = decode(article.body
    .replace(/\r?\n/g, "")
    .replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
    .replace(/<.*?>/g, ""));
  return {
    ...article,
    ...dt,
    description: description
  };
};

const readArticles = async () => {
  const articles = await readJSONFile(articlesFile);
  return articles.map(extendArticle);
};

const extendDocument = document => {
  const dt = expandDatetime(document.published);
  return {
    ...document,
    ...dt
  };
};

const readDocuments = async () => {
  const documents = await readJSONFile(documentsFile);
  return documents.map(extendDocument);
};

const isPhoto = filename => {
  if (path.extname(filename) === ".jpg") {
    return true;
  }

  return false;
};

const extendPhoto = photo => ({
  filename: photo,
  url: `/img/photos/${photo}`
});

const listPhotos = async () => {
  const photos = await fs.readdir(photosDir);
  return photos
    .filter(isPhoto)
    .sort()
    .reverse()
    .map(extendPhoto);
};

const extendStatus = status => {
  const dt = expandDatetime(status.published);
  return {
    ...status,
    ...dt
  };
};

const readStatuses = async () => {
  const statuses = await readJSONFile(statusesFile);
  return statuses.map(extendStatus);
};

const extendLink = link => {
  const dt = expandDatetime(link.published);
  return {
    ...link,
    ...dt
  };
};

const readLinks = async () => {
  const links = await readJSONFile(linksFile);
  return links.map(extendLink);
};

const readPartial = async filename => {
  const name = path.basename(filename, ".mustache");
  const content = await fs.readFile(path.join(partialDir, filename), "utf8");
  return {
    [name]: content
  };
};

const gatherPartials = partials => Object.assign(...partials);

const readPartials = async () => {
  const filenames = await fs.readdir(partialDir);
  const partials = await Promise.all(filenames.map(readPartial));
  return gatherPartials(partials);
};

const hasSameLink = (dest, article) => dest.endsWith(article.link);

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

const mergeData = async (extradataFile, dest, metadata) => {
  const extradata = await readJSONFile(extradataFile);

  if (extradataFile === articleJSON) {
    const article = metadata.articles.find(hasSameLink.bind(null, dest));
    const firstImage = /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/.exec(article.body);
    const [cardType, cover] = findCover(
      firstImage,
      metadata.cardType,
      metadata.cover
    );
    return {
      ...metadata,
      ...extradata,
      ...article,
      canonical: article.link,
      cardType: cardType,
      cover: cover,
      shortTitle: article.title
    };
  }

  return {
    ...metadata,
    ...extradata,
    articles: metadata.articles.map(markItemChanges),
    documents: metadata.documents.map(markItemChanges),
    links: metadata.links.map(markItemChanges),
    statuses: metadata.statuses.map(markItemChanges)
  };
};

const buildHTML = async (metadata, partials, file) => {
  const [data, template] = await Promise.all([
    mergeData(file.json, file.dest, metadata),
    fs.readFile(file.src, "utf8")
  ]);
  data.isLog = file.isLog;

  if (data.isLog && file.dest.endsWith("/log.html")) {
    data.canonical = `${data.canonical}log.html`;
  }

  if (!data.isLog) {
    data.articles = data.articles.slice(0, 15);
    data.comics = data.comics.slice(0, 5);
    data.documents = data.documents.slice(0, 5);
    data.nonfictions = data.nonfictions.slice(0, 5);
    data.novels = data.novels.slice(0, 5);
    data.photos = data.photos.slice(0, 60);
    data.statuses = data.statuses.slice(0, 15);
    data.links = data.links.slice(0, 15);
  }

  if (data.isHome) {
    data.articles = data.articles.slice(0, 5);
    data.books = [
      data.novels[0],
      data.nonfictions[0],
      data.comics[0],
      data.nonfictions[1],
      data.novels[1]
    ];
    data.photos = data.photos.slice(0, 5);
    data.statuses = data.statuses.slice(0, 1);
    data.links = data.links.slice(0, 5);
  }

  const rendered = mustache.render(template, data, partials);
  await fs.writeFile(file.dest, rendered);
};

const toFilesFormat = article => ({
  dest: toPOSIXPath(path.join(destDir, article.link)),
  json: articleJSON,
  src: articleSrc,
  ...article
});

const main = async () => {
  const [
    metadata,
    articles,
    comics,
    documents,
    nonfictions,
    novels,
    photos,
    statuses,
    links,
    partials
  ] = await Promise.all([
    readJSONFile(metadataFile),
    readArticles(),
    readJSONFile(comicsFile),
    readDocuments(),
    readJSONFile(nonfictionsFile),
    readJSONFile(novelsFile),
    listPhotos(),
    readStatuses(),
    readLinks(),
    readPartials()
  ]);
  metadata.articles = articles;
  metadata.comics = comics;
  metadata.documents = documents;
  metadata.nonfictions = nonfictions;
  metadata.novels = novels;
  metadata.photos = photos;
  metadata.statuses = statuses;
  metadata.links = links;

  if (argv.article) {
    return buildHTML(metadata, partials, {
      dest: argv.article,
      json: articleJSON,
      src: articleSrc
    });
  }

  if (argv.all) {
    const articleFiles = await Promise.all(articles.map(toFilesFormat));
    return Promise.all([
      ...files,
      ...articleFiles
    ].map(buildHTML.bind(null, metadata, partials)));
  }

  return Promise.all(files.map(buildHTML.bind(null, metadata, partials)));
};

process.chdir(__dirname);
mustache.escape = encode;
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
