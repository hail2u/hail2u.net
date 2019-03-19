const { decode, encode } = require("../lib/html-entities");
const fs = require("fs").promises;
const minimist = require("minimist");
const mustache = require("mustache");
const path = require("path");
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
    src: "../src/blog/index.mustache"
  },
  {
    dest: "../dist/documents/index.html",
    json: "../src/documents/index.json",
    src: "../src/documents/index.mustache"
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
    dest: "../dist/links/index.html",
    json: "../src/links/index.json",
    src: "../src/links/index.mustache"
  },
  {
    dest: "../dist/photos/index.html",
    json: "../src/photos/index.json",
    src: "../src/photos/index.mustache"
  },
  {
    dest: "../dist/sitemap.xml",
    json: "../src/index.json",
    src: "../src/sitemap.mustache"
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
const webpagesFile = "../src/links/webpages.json";

const readJSONFile = async file => {
  const json = await fs.readFile(file, "utf8");
  return JSON.parse(json);
};

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

const extendWebpage = webpage => {
  const dt = expandDatetime(webpage.added);
  return {
    ...webpage,
    ...dt
  };
};

const readWebpages = async () => {
  const webpages = await readJSONFile(webpagesFile);
  return webpages.map(extendWebpage);
};

const isPhotofile = filename => {
  if (path.extname(filename) === ".jpg") {
    return true;
  }

  return false;
}

const extendPhotofile = photofile => ({
  filename: photofile,
  url: `/img/photos/${photofile}`
});

const listSnapshots = async () => {
  const snapshots = await fs.readdir(snapshotsDir);
  return snapshots.filter(isPhotofile).sort().map(extendPhotofile);
};

const compareByUnixtime = (a, b) =>
  Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const extendArticle = article => {
  const dt = expandDatetime(article.published);
  return {
    ...article,
    ...dt,
    description: decode(
      article.body
        .replace(/\r?\n/g, "")
        .replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
        .replace(/<.*?>/g, "")
    )
  };
};

const readArticles = async () => {
  const articles = await readJSONFile(articlesFile);
  return articles.sort(compareByUnixtime).map(extendArticle);
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

const now = date =>
  `${dowNames[date.getDay()]}, ${date.getDate()} ${
    monthNames[date.getMonth()]
  } ${date.getFullYear()} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())} +0900`;

const mergeData = async (
  extradataFile,
  articles,
  dest,
  metadata,
  includeUpdates,
  itemLength
) => {
  const extradata = await readJSONFile(extradataFile);

  if (argv.article || argv.all) {
    const article = articles.find(hasSameLink.bind(null, dest));
    const [cardType, cover] = findCover(
      /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/.exec(article.body),
      metadata.card_type,
      metadata.cover
    );
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
    articles: articles
      .slice(0)
      .map(markArticleChanges)
      .slice(0, itemLength),
    lastBuildDate: now(new Date())
  };
};

const toAbsoluteURLinBody = article => ({
  ...article,
  body: article.body.replace(/(href|src)="(\/.*?)"/g, '$1="https://hail2u.net$2"')
});

const render = (template, data, partials, dest) => {
  if (dest.endsWith("/feed")) {
    const articles = data.articles.map(toAbsoluteURLinBody);
    return mustache.render(
      template,
      {
        ...data,
        articles: articles
      },
      partials
    );
  }

  return mustache.render(template, data, partials);
};

const buildHTML = async (metadata, articles, partials, file) => {
  const [data, template] = await Promise.all([
    mergeData(
      file.json,
      articles,
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

const toFilesFormat = article => ({
  dest: toPOSIXPath(path.join(destDir, article.link)),
  json: articleJSON,
  src: articleSrc,
  ...article
});

const main = async () => {
  const [
    metadata,
    nonfictions,
    comics,
    novels,
    webpages,
    snapshots,
    articles,
    partials
  ] = await Promise.all([
    readJSONFile(metadataFile),
    readJSONFile(nonfictionsFile),
    readJSONFile(comicsFile),
    readJSONFile(novelsFile),
    readWebpages(),
    listSnapshots(),
    readArticles(),
    readPartials()
  ]);
  metadata.nonfictions = nonfictions.reverse().slice(0, 5);
  metadata.comics = comics.reverse().slice(0, 5);
  metadata.novels = novels.reverse().slice(0, 5);
  metadata.webpages = webpages.reverse().slice(0, 10);
  metadata.snapshots = snapshots.reverse().slice(0, 60);

  if (argv.article) {
    return buildHTML(metadata, articles, partials, {
      dest: argv.article,
      json: articleJSON,
      src: articleSrc
    });
  }

  if (argv.all) {
    const allFiles = await Promise.all(articles.map(toFilesFormat));
    return Promise.all(
      allFiles.map(buildHTML.bind(null, metadata, articles, partials))
    );
  }

  return Promise.all(
    files.map(buildHTML.bind(null, metadata, articles, partials))
  );
};

process.chdir(__dirname);
mustache.escape = encode;
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
