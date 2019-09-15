const { decode, encode } = require("../lib/html-entities");
const fs = require("fs").promises;
const highlight = require("../lib/highlight");
const htmlMinifier = require("html-minifier");
const minimist = require("minimist");
const mustache = require("mustache");
const path = require("path");
const { readJSONFile } = require("../lib/json");
const toPOSIXPath = require("../lib/to-posix-path");
const { version } = require("../package.json");

const argv = minimist(process.argv.slice(2), {
  alias: {
    A: "articles",
    a: "article"
  },
  boolean: ["articles"],
  string: ["article"]
});
const articleJSON = "../src/blog/article.json";
const articleSrc = "../src/blog/article.mustache";
const articlesFile = "../src/blog/articles.json";
const comicsFile = "../src/bookshelf/comics.json";
const destDir = "../dist/";
const documentsFile = "../src/documents/documents.json";
const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const files = [
  {
    dest: "../dist/bookshelf/log.html",
    json: "../src/bookshelf/index.json",
    src: "../src/bookshelf/log.mustache"
  },
  {
    dest: "../dist/bookshelf/index.html",
    json: "../src/bookshelf/index.json",
    src: "../src/bookshelf/index.mustache"
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
    dest: "../dist/photos/log.html",
    json: "../src/photos/index.json",
    src: "../src/photos/log.mustache"
  },
  {
    dest: "../dist/photos/index.html",
    json: "../src/photos/index.json",
    src: "../src/photos/index.mustache"
  },
  {
    dest: "../dist/sitemap.xml",
    json: "../src/sitemap.json",
    src: "../src/sitemap.mustache"
  },
  {
    dest: "../dist/statuses/index.html",
    json: "../src/statuses/index.json",
    src: "../src/statuses/index.mustache"
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
    description: description,
    isArticle: true
  };
};

const readArticles = async () => {
  const articles = await readJSONFile(articlesFile);
  return articles.map(extendArticle);
};

const extendBook = book => {
  const dt = expandDatetime(book.published);
  return {
    ...book,
    ...dt,
    isBook: true
  };
};

const readBooks = async file => {
  const books = await readJSONFile(file);
  return books.map(extendBook);
};

const extendDocument = document => {
  const dt = expandDatetime(document.published);
  return {
    ...document,
    ...dt,
    isDocument: true
  };
};

const readDocuments = async () => {
  const documents = await readJSONFile(documentsFile);
  return documents.map(extendDocument);
};

const extendLink = link => {
  const dt = expandDatetime(link.published);
  return {
    ...link,
    ...dt,
    isLink: true
  };
};

const readLinks = async () => {
  const links = await readJSONFile(linksFile);
  return links.map(extendLink);
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
  const published = getPhotoDatetime(photo);
  const dt = expandDatetime(published);
  return {
    ...dt,
    filename: photo,
    isPhoto: true,
    published: published,
    url: `/img/photos/${photo}`
  };
};

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
    ...dt,
    isStatus: true
  };
};

const readStatuses = async () => {
  const statuses = await readJSONFile(statusesFile);
  return statuses.map(extendStatus);
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

const findCover = (image, defaultTwitterCard, defaultCover) => {
  if (!image) {
    return [defaultTwitterCard, defaultCover];
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

const markItems = items => Promise.all(items.map(markItemChanges));

const mergeData = async (extradataFile, dest, metadata) => {
  const extradata = await readJSONFile(extradataFile);

  if (extradataFile === articleJSON) {
    const article = metadata.articles.find(hasSameLink.bind(null, dest));
    const firstImage = /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/.exec(article.body);
    const [twitterCard, cover] = findCover(
      firstImage,
      metadata.twitterCard,
      metadata.cover
    );
    return {
      ...metadata,
      ...extradata,
      ...article,
      canonical: article.link,
      cover: cover,
      shortTitle: article.title,
      twitterCard: twitterCard
    };
  }

  const [
    articles,
    books,
    documents,
    links,
    photos,
    statuses
  ] = await Promise.all([
    metadata.articles,
    metadata.books,
    metadata.documents,
    metadata.links,
    metadata.photos,
    metadata.statuses
  ].map(markItems));
  return {
    ...metadata,
    ...extradata,
    articles: articles,
    books: books,
    documents: documents,
    links: links,
    photos: photos,
    statuses: statuses
  };
};

const markFirstItem = items => {
  const firstItem = items.shift();
  firstItem.isFirstInMonth = true;
  firstItem.isFirstInYear = true;
  return [
    firstItem,
    ...items
  ];
};

const buildHTML = async (metadata, partials, file) => {
  const [data, template] = await Promise.all([
    mergeData(file.json, file.dest, metadata),
    fs.readFile(file.src, "utf8")
  ]);

  if (file.dest.endsWith("/log.html")) {
    data.canonical = `${data.canonical}log.html`;
  } else {
    data.otherBooks = markFirstItem(data.books.slice(36));
    data.numOtherBooks = data.otherBooks.length;
    data.otherPhotos = markFirstItem(data.photos.slice(36));
    data.numOtherPhotos = data.otherPhotos.length;
    data.books = data.books.slice(0, 36);
    data.photos = data.photos.slice(0, 36);
  }

  if (data.isHome) {
    data.articles = data.articles.slice(0, 6);
    data.books = [
      data.nonfictions[0],
      data.novels[0],
      data.comics[0],
      data.nonfictions[1],
      data.novels[1],
      data.comics[1]
    ];
    data.documents = data.documents.slice(0, 3);
    data.links = data.links.slice(0, 6);
    data.photos = data.photos.slice(0, 6);
    data.statuses = data.statuses.slice(0, 1);
  }

  const rendered = mustache.render(template, data, partials);
  const highlighted = highlight(rendered);
  const minified = htmlMinifier.minify(highlighted, {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    continueOnParseError: false,
    html5: true,
    includeAutoGeneratedTags: true,
    preserveLineBreaks: true,
    preventAttributesEscaping: true,
    processConditionalComments: true,
    quoteCharacter: '"',
    removeAttributeQuotes: true,
    removeComments: true,
    removeEmptyElements: true,
    removeOptionalTags: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeTagWhitespace: true,
    sortAttributes: true,
    sortClassName: true,
    trimCustomFragments: true
  });
  await fs.writeFile(file.dest, minified);
};

const toFilesFormat = article => ({
  dest: toPOSIXPath(path.join(destDir, article.link)),
  json: articleJSON,
  src: articleSrc,
  ...article
});

const compareByPublished = (a, b) =>
  Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

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
    statuses,
    partials
  ] = await Promise.all([
    readJSONFile(metadataFile),
    readArticles(),
    readBooks(comicsFile),
    readDocuments(),
    readLinks(),
    readBooks(nonfictionsFile),
    readBooks(novelsFile),
    listPhotos(),
    readStatuses(),
    readPartials()
  ]);
  metadata.articles = articles;
  metadata.books = [
    ...comics,
    ...nonfictions,
    ...novels
  ].sort(compareByPublished);
  metadata.comics = comics;
  metadata.documents = documents;
  metadata.items = [
    ...articles.slice(0, itemLength),
    ...comics.slice(0, itemLength),
    ...documents.slice(0, itemLength),
    ...links.slice(0, itemLength),
    ...nonfictions.slice(0, itemLength),
    ...novels.slice(0, itemLength),
    ...photos.slice(0, itemLength),
    ...statuses.slice(0, itemLength)
  ].sort(compareByPublished)
    .slice(0, itemLength);
  metadata.links = links;
  metadata.nonfictions = nonfictions;
  metadata.novels = novels;
  metadata.photos = photos;
  metadata.statuses = statuses;
  metadata.version = version;

  if (argv.article) {
    return buildHTML(metadata, partials, {
      dest: argv.article,
      json: articleJSON,
      src: articleSrc
    });
  }

  if (argv.articles) {
    const articleFiles = await Promise.all(articles.map(toFilesFormat));
    return Promise.all(articleFiles.map(buildHTML.bind(
      null,
      metadata,
      partials
    )));
  }

  return Promise.all(files.map(buildHTML.bind(null, metadata, partials)));
};

process.chdir(__dirname);
mustache.escape = encode;
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
