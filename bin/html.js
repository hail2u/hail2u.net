import config from "../config.js";
import { escapeCharacters } from "./lib/character-reference.js";
import fs from "node:fs/promises";
import { globAsync } from "./lib/glob-async.js";
import { guessPath } from "./lib/guess-path.js";
import mustache from "mustache";
import { outputFile } from "./lib/output-file.js";
import path from "node:path";
import { readJSONFile } from "./lib/json-file.js";
import util from "node:util";

const isFirstInDate = (current, previous) => {
  if (!previous || current.date !== previous.date) {
    return true;
  }

  return false;
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

const isLastInDate = (current, next) => {
  if (!next || current.date !== next.date) {
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

const markItem = (item, index, items) => {
  if (!item.published) {
    return item;
  }

  const nextItem = items[index + 1];
  const previousItem = items[index - 1];
  return {
    ...item,
    isFirstInDate: isFirstInDate(item, previousItem),
    isFirstInMonth: isFirstInMonth(item, previousItem),
    isFirstInYear: isFirstInYear(item, previousItem),
    isLastInDate: isLastInDate(item, nextItem),
    isLastInMonth: isLastInMonth(item, nextItem),
    isLastInYear: isLastInYear(item, nextItem)
  };
};

const readData = async (file) => {
  const basename = path.basename(file, ".json");
  const data = await readJSONFile(file);
  const marked = await Promise.all(data.map(markItem));
  return { [ basename ]: marked };
};

const readAllData = async () => {
  const files = await globAsync(`${config.dir.data}**/*.json`);
  const data = await Promise.all(files.map(readData));
  return Object.assign(...data);
};

const readPartial = async (file) => {
  const basename = path
    .basename(file, ".mustache")
    .substring(1);
  const partial = await fs.readFile(file, "utf8");
  return { [ basename ]: partial };
};

const readPartials = async () => {
  const files = await globAsync(`${config.dir.template}partials/*.mustache`);
  const partials = await Promise.all(files.map(readPartial));
  return Object.assign(...partials);
};

const toFilesFormat = (file) => {
  if (typeof file === "object") {
    const template = path.join(config.dir.template, "blog/_article.mustache");
    return {
      ...file,
      dest: path.join(config.dir.dest, file.link),
      metadata: guessPath(template, config.dir.metadata, "article.json"),
      template
    };
  }

  return {
    dest: guessPath(file, config.dir.dest, ".html"),
    metadata: guessPath(file, config.dir.metadata, ".json"),
    template: file
  };
};

const gatherFiles = async () => {
  const files = await globAsync(`${config.dir.template}**/*.mustache`, { ignore: `**/_*` });
  return Promise.all(files.map(toFilesFormat));
};

const hasSameLink = (dest, article) => dest.endsWith(article.link);

const findCover = (html) => {
  const image = /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/u.exec(html);

  if (!image) {
    return {};
  }

  return {
    cover: image[1],
    twitterCard: "summary_large_image"
  };
};

const mergeData = async (file, metadata, data) => {
  const overrides = await readJSONFile(file.metadata);

  if (overrides.isArticle) {
    const article = data.articles.find(hasSameLink.bind(null, file.dest));
    const cover = findCover(article.body);
    return {
      ...metadata,
      ...data,
      ...overrides,
      ...article,
      ...cover,
      canonical: article.link
    };
  }

  if (overrides.isHome) {
    return {
      ...metadata,
      ...data,
      ...overrides,
      homeArticles: data.articles.slice(0, 6),
      homeBooks: data.books.slice(0, 3),
      homeLinks: data.links.slice(0, 6),
      homeProjects: data.projects.slice(0, 3),
      homeStatuses: data.statuses.slice(0, 1)
    };
  }

  return {
    ...metadata,
    ...data,
    ...overrides
  };
};

const build = async (metadata, data, partials, file) => {
  const [
    merged,
    template
  ] = await Promise.all([
    mergeData(file, metadata, data),
    fs.readFile(file.template, "utf8")
  ]);
  const rendered = mustache.render(template, merged, partials, { escape: escapeCharacters });
  await outputFile(file.dest, rendered);
};

const main = async () => {
  const [
    metadata,
    {
      articles,
      books,
      links,
      projects,
      statuses,
      subscriptions
    },
    partials,
    {
      values: {
        all,
        latest
      }
    },
    files
  ] = await Promise.all([
    readJSONFile(path.join(config.dir.metadata, "root.json")),
    readAllData(),
    readPartials(),
    util.parseArgs({
      options: {
        all: {
          short: "a",
          type: "boolean"
        },
        latest: {
          short: "l",
          type: "boolean"
        }
      }
    }),
    gatherFiles()
  ]);
  const data = {
    articles,
    books,
    links,
    projects,
    statuses,
    subscriptions,
    version: config.version
  };

  if (latest) {
    const article = await toFilesFormat(articles[0]);
    await build(metadata, data, partials, article);
  }

  if (all) {
    const articleFiles = await Promise.all(articles.map(toFilesFormat));

    while (articleFiles.length > 0) {
      const chunk = articleFiles.splice(-1024);
      /* eslint-disable-next-line no-await-in-loop */
      await Promise.all(chunk.map(build.bind(null, metadata, data, partials)));
    }
  }

  await Promise.all(files.map(build.bind(null, metadata, data, partials)));
};

main().catch((e) => {
  /* eslint-disable-next-line no-console */
  console.trace(e);
  process.exitCode = 1;
});
