import config from "../config.js";
import { escapeCharacters } from "./lib/character-reference.js";
import fs from "node:fs/promises";
import { guessPath } from "./lib/guess-path.js";
import mustache from "mustache";
import os from "node:os";
import path from "node:path";
import util from "node:util";

const isFirstInDate = (item, previous) => {
  if (
    item.year !== previous.year ||
    item.month !== previous.month ||
    item.date !== previous.date
  ) {
    return true;
  }

  return false;
};

const isFirstInMonth = (item, previous) => {
  if (item.year !== previous.year || item.month !== previous.month) {
    return true;
  }

  return false;
};

const isFirstInYear = (item, previous) => {
  if (item.year !== previous.year) {
    return true;
  }

  return false;
};

const isLastInDate = (item, next) => {
  if (
    item.year !== next?.year ||
    item.month !== next?.month ||
    item.date !== next?.date
  ) {
    return true;
  }

  return false;
};

const isLastInMonth = (item, next) => {
  if (item.year !== next?.year || item.month !== next?.month) {
    return true;
  }

  return false;
};

const isLastInYear = (item, next) => {
  if (item.year !== next?.year) {
    return true;
  }

  return false;
};

const markItem = (item, index, items) => {
  if (!item.published) {
    return item;
  }

  const previous = items.at(index - 1);
  const next = items.at(index + 1);
  return {
    ...item,
    isFirstInDate: isFirstInDate(item, previous),
    isFirstInMonth: isFirstInMonth(item, previous),
    isFirstInYear: isFirstInYear(item, previous),
    isLastInDate: isLastInDate(item, next),
    isLastInMonth: isLastInMonth(item, next),
    isLastInYear: isLastInYear(item, next),
  };
};

const readData = async (file) => {
  const basename = path.basename(file, ".json");
  const data = await fs.readFile(file).then(JSON.parse);
  const marked = await Promise.all(data.map(markItem));
  return {
    [basename]: marked,
  };
};

const readMetadata = (file) => fs.readFile(file).then(JSON.parse);

const hasPageOrder = ({ pageOrder }) => pageOrder;

const comparePageOrder = (a, b) => a.pageOrder - b.pageOrder;

const buildPages = async () => {
  const globber = fs.glob(`${config.dir.metadata}**/*.json`);
  const metadata = await Array.fromAsync(globber, readMetadata);
  return metadata.filter(hasPageOrder).toSorted(comparePageOrder);
};

const readAllData = async () => {
  const globber = fs.glob(`${config.dir.data}**/*.json`);
  const data = await Array.fromAsync(globber, readData);
  const allData = Object.assign(...data);
  const pages = await buildPages();
  return {
    ...allData,
    pages,
    version: config.version,
  };
};

const readPartial = async (file) => {
  const basename = path.basename(file, ".mustache").substring(1);
  const partial = await fs.readFile(file, "utf8");
  return {
    [basename]: partial,
  };
};

const readPartials = async () => {
  const globber = fs.glob(`${config.dir.partial}/_*.mustache`);
  const partials = await Array.fromAsync(globber, readPartial);
  return Object.assign(...partials);
};

const startsWithUnderscore = (file) => path.basename(file).startsWith("_");

const isString = (string) => typeof string === "string";

const isDocument = (type) => type === "document";

const isTooOld = (time) => {
  const oneYearInMS = 1000 * 60 * 60 * 24 * 365;
  const oneYearAgo = Date.now() - oneYearInMS;

  if (oneYearAgo < time) {
    return false;
  }

  return true;
};

const guessTemplate = (template) => {
  if (isString(template)) {
    return template;
  }

  if (isDocument(template.type) || isTooOld(template.published)) {
    return path.join(config.dir.template, config.template.old);
  }

  return path.join(config.dir.template, config.template.article);
};

const guessDest = (template, basename) => {
  if (isString(template)) {
    return guessPath(template, config.dir.dest, basename);
  }

  return path.join(config.dir.dest, template.link);
};

const toFilesFormat = (template) => {
  const templateFile = guessTemplate(template);
  const basename = path.basename(templateFile, path.extname(templateFile));
  const dest = guessDest(template, basename);
  const ext = path.extname(basename);
  const metadata = guessPath(
    templateFile,
    config.dir.metadata,
    basename.replace(ext, ".json"),
  );
  return {
    dest,
    metadata,
    template: templateFile,
  };
};

const gatherFiles = () => {
  const globber = fs.glob(`${config.dir.template}**/*.mustache`, {
    exclude: startsWithUnderscore,
  });
  return Array.fromAsync(globber, toFilesFormat);
};

const isBlogPage = (page) => page.isBlog;

const getFeedInfo = ({ isBlog, title, canonical }, blogPage) => {
  if (!isBlog) {
    return {
      feedTitle: title,
      feedURL: `${canonical}${config.feed}`,
    };
  }

  return {
    feedTitle: blogPage.title,
    feedURL: `${blogPage.canonical}${config.feed}`,
  };
};

const hasSameLink = (dest, { link }) => dest.endsWith(link);

const mergeData = async (file, metadata, data) => {
  const overrides = await fs.readFile(file.metadata).then(JSON.parse);

  if (overrides.hasOwnFeed) {
    const blogPage = data.pages.find(isBlogPage);
    const { feedTitle, feedURL } = getFeedInfo(overrides, blogPage);
    overrides.feedTitle = feedTitle;
    overrides.feedURL = feedURL;
  }

  if (overrides.isArticle) {
    const article = data.articles.find(hasSameLink.bind(null, file.dest));
    return {
      ...metadata,
      ...data,
      ...overrides,
      ...article,
      canonical: article.link,
    };
  }

  if (overrides.isHome) {
    return {
      ...metadata,
      ...data,
      ...overrides,
      homeArticles: data.articles.slice(0, overrides.itemLength.articles),
      homeBooks: data.books.slice(0, overrides.itemLength.books),
      homeLinks: data.links.slice(0, overrides.itemLength.links),
      homeProjects: data.projects.slice(0, overrides.itemLength.projects),
      homeStatuses: data.statuses.slice(0, overrides.itemLength.statuses),
    };
  }

  if (overrides.isStatuses) {
    const log = await fs.readFile(config.file.statusLog, "utf8");
    return {
      ...metadata,
      ...data,
      ...overrides,
      log,
    };
  }

  return {
    ...metadata,
    ...data,
    ...overrides,
  };
};

const build = async (metadata, data, partials, file) => {
  const template = await fs.readFile(file.template, "utf8");
  const merged = await mergeData(file, metadata, data);
  const rendered = mustache.render(template, merged, partials, {
    escape: escapeCharacters,
  });
  await fs.mkdir(path.dirname(file.dest), {
    recursive: true,
  });
  return fs.writeFile(file.dest, rendered);
};

const {
  values: { all, latest },
} = util.parseArgs({
  options: {
    all: {
      type: "boolean",
    },
    latest: {
      type: "boolean",
    },
  },
});
const data = await readAllData();
const partials = await readPartials();

if (latest) {
  const latestArticle = toFilesFormat(data.articles.at(0));
  await build(config, data, partials, latestArticle);
}

if (all) {
  const articleFiles = await Promise.all(data.articles.map(toFilesFormat));
  const thread = os.availableParallelism();
  const repeat = Math.ceil(articleFiles.length / thread);

  for (let i = 0; i < repeat; i += 1) {
    const chunk = articleFiles.slice(i * thread, (i + 1) * thread);
    /* eslint-disable-next-line no-await-in-loop */
    await Promise.all(chunk.map(build.bind(null, config, data, partials)));
  }
}

const files = await gatherFiles();
await Promise.all(files.map(build.bind(null, config, data, partials)));
