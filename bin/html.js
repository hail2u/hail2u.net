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
const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const files = [
  {
    dest: "../dist/blog/index.html",
    json: "../src/blog/index.json",
    isLog: true,
    src: "../src/blog/index.mustache"
  },
  {
    dest: "../dist/documents/index.html",
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
    json: "../src/links/index.json",
    isLog: true,
    src: "../src/links/log.mustache"
  },
  {
    dest: "../dist/photos/index.html",
    json: "../src/photos/index.json",
    src: "../src/photos/index.mustache"
  },
  {
    dest: "../dist/photos/log.html",
    json: "../src/photos/index.json",
    isLog: true,
    src: "../src/photos/log.mustache"
  },
  {
    dest: "../dist/sitemap.xml",
    json: "../src/index.json",
    src: "../src/sitemap.mustache"
  },
  {
    dest: "../dist/statuses/index.html",
    json: "../src/statuses/index.json",
    src: "../src/statuses/index.mustache"
  },
  {
    dest: "../dist/statuses/log.html",
    json: "../src/statuses/index.json",
    isLog: true,
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
const snapshotsDir = "../src/img/photos/";
const textsFile = "../src/statuses/texts.json";
const webpagesFile = "../src/links/webpages.json";

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

const compareByUnixtime = (a, b) => Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

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
  return articles
    .sort(compareByUnixtime)
    .map(extendArticle);
};

const isSnapshot = filename => {
  if (path.extname(filename) === ".jpg") {
    return true;
  }

  return false;
}

const extendSnapshot = snapshot => ({
  filename: snapshot,
  url: `/img/photos/${snapshot}`
});

const listSnapshots = async () => {
  const snapshots = await fs.readdir(snapshotsDir);
  return snapshots
    .filter(isSnapshot)
    .sort()
    .reverse()
    .map(extendSnapshot);
};

const extendText = text => {
  const dt = expandDatetime(text.published);
  return {
    ...text,
    ...dt
  };
};

const readTexts = async () => {
  const texts = await readJSONFile(textsFile);
  return texts.map(extendText);
};

const extendWebpage = webpage => {
  const dt = expandDatetime(webpage.published);
  return {
    ...webpage,
    ...dt
  };
};

const readWebpages = async () => {
  const webpages = await readJSONFile(webpagesFile);
  return webpages.map(extendWebpage);
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

const markArticleChanges = (article, index, articles) => {
  const nextArticle = articles[index + 1];
  const previousArticle = articles[index - 1];
  return {
    ...article,
    isFirstInMonth: isFirstInMonth(article, previousArticle),
    isFirstInYear: isFirstInYear(article, previousArticle),
    isLastInMonth: isLastInMonth(article, nextArticle),
    isLastInYear: isLastInYear(article, nextArticle),
    isLatest: isLatest(index)
  };
};

const mergeData = async (extradataFile, dest, metadata) => {
  const extradata = await readJSONFile(extradataFile);

  if (argv.article || argv.all) {
    const article = metadata.articles.find(hasSameLink.bind(null, dest));
    const firstImage = /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/.exec(article.body);
    const [cardType, cover] = findCover(firstImage, metadata.card_type, metadata.cover);
    return {
      ...metadata,
      ...extradata,
      ...article,
      canonical: article.link,
      card_type: cardType,
      cover: cover,
      short_title: article.title
    };
  }

  return {
    ...metadata,
    ...extradata,
    articles: metadata.articles.map(markArticleChanges)
  };
};

const buildHTML = async (metadata, partials, file) => {
  const [data, template] = await Promise.all([
    mergeData(file.json, file.dest, metadata),
    fs.readFile(file.src, "utf8")
  ]);

  if (!file.isLog) {
    data.articles = data.articles.slice(0, 5);
    data.comics = data.comics.slice(0, 5);
    data.nonfictions = data.nonfictions.slice(0, 5);
    data.novels = data.novels.slice(0, 5);
    data.snapshots = data.snapshots.slice(0, 60);
    data.texts = data.texts.slice(0, 15);
    data.webpages = data.webpages.slice(0, 15);
  }

  if (file.isLog && file.dest.endsWith("/log.html")) {
    data.canonical = `${data.canonical}log.html`;
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
    nonfictions,
    novels,
    snapshots,
    texts,
    webpages,
    partials
  ] = await Promise.all([
    readJSONFile(metadataFile),
    readArticles(),
    readJSONFile(comicsFile),
    readJSONFile(nonfictionsFile),
    readJSONFile(novelsFile),
    listSnapshots(),
    readTexts(),
    readWebpages(),
    readPartials()
  ]);
  metadata.articles = articles;
  metadata.comics = comics;
  metadata.nonfictions = nonfictions;
  metadata.novels = novels;
  metadata.snapshots = snapshots;
  metadata.texts = texts;
  metadata.texts[0].isLatest = true;
  metadata.webpages = webpages;

  if (argv.article) {
    return buildHTML(metadata, partials, {
      dest: argv.article,
      json: articleJSON,
      src: articleSrc
    });
  }

  if (argv.all) {
    const allFiles = await Promise.all(articles.map(toFilesFormat));
    return Promise.all(allFiles.map(buildHTML.bind(null, metadata, partials)));
  }

  return Promise.all(files.map(buildHTML.bind(null, metadata, partials)));
};

process.chdir(__dirname);
mustache.escape = encode;
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
