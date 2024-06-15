import config from "../config.js";
import fs from "node:fs/promises";
import { guessPath } from "./lib/guess-path.js";
import { outputFile } from "./lib/output-file.js";
import path from "node:path";
import { readJSONFile } from "./lib/json-file.js";
import { renderTemplate } from "./lib/render-template.js";
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
    isLastInYear: isLastInYear(item, nextItem),
  };
};

const readData = async (file) => {
  const basename = path.basename(file, ".json");
  const data = await readJSONFile(file);
  const marked = await Promise.all(data.map(markItem));
  return { [basename]: marked };
};

const readAllData = async () => {
  const files = await fs.glob(`${config.dir.data}**/*.json`);
  const data = await Array.fromAsync(files, readData);
  return Object.assign(...data);
};

const readPartial = async (file) => {
  const basename = path.basename(file, ".mustache").substring(1);
  const partial = await fs.readFile(file, "utf8");
  return { [basename]: partial };
};

const readPartials = async () => {
  const files = await fs.glob(`${config.dir.template}partials/*.mustache`);
  const partials = await Array.fromAsync(files, readPartial);
  return Object.assign(...partials);
};

const toFilesFormat = (file) => {
  if (typeof file === "object") {
    const template = path.join(
      config.dir.template,
      "blog",
      "_article.mustache",
    );
    return {
      ...file,
      dest: path.join(config.dir.dest, file.link),
      metadata: guessPath(template, config.dir.metadata, "article.json"),
      template,
    };
  }

  const basename = path.basename(file, path.extname(file));
  const doubleExt = path.extname(basename);

  if (doubleExt) {
    const dirname = path.dirname(file);
    return {
      dest: guessPath(path.join(dirname, basename), config.dir.dest, doubleExt),
      metadata: guessPath(
        path.join(dirname, basename),
        config.dir.metadata,
        ".json",
      ),
      template: file,
    };
  }

  return {
    dest: guessPath(file, config.dir.dest, ".html"),
    metadata: guessPath(file, config.dir.metadata, ".json"),
    template: file,
  };
};

const startsWithUnderscore = (file) => {
  const filename = file.split("/").at(-1);
  return filename.startsWith("_");
};

const gatherFiles = async () => {
  const files = await fs.glob(`${config.dir.template}**/*.mustache`, {
    exclude: startsWithUnderscore,
  });
  return Array.fromAsync(files, toFilesFormat);
};

const hasSameLink = (dest, article) => dest.endsWith(article.link);

const mergeData = async (file, metadata, data) => {
  const overrides = await readJSONFile(file.metadata);

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
      homeArticles: data.articles.slice(0, 6),
      homeBooks: data.books.slice(0, 4),
      homeLinks: data.links.slice(0, 6),
      homeProjects: data.projects.slice(0, 3),
      homeStatuses: data.statuses.slice(0, 1),
    };
  }

  if (overrides.isStatuses) {
    const logFile = guessPath(file.template, config.dir.data, "log.html");
    const log = await fs.readFile(logFile, "utf8");
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
  const [merged, template] = await Promise.all([
    mergeData(file, metadata, data),
    fs.readFile(file.template, "utf8"),
  ]);
  const rendered = renderTemplate(template, merged, partials);
  await outputFile(file.dest, rendered);
};

const main = async () => {
  const [
    metadata,
    { articles, books, links, projects, statuses, websites },
    partials,
    {
      values: { all, latest },
    },
    files,
  ] = await Promise.all([
    readJSONFile(path.join(config.dir.metadata, "root.json")),
    readAllData(),
    readPartials(),
    util.parseArgs({
      options: {
        all: {
          short: "a",
          type: "boolean",
        },
        latest: {
          short: "l",
          type: "boolean",
        },
      },
    }),
    gatherFiles(),
  ]);
  const data = {
    articles,
    books,
    links,
    projects,
    statuses,
    version: config.version,
    websites,
  };

  if (latest) {
    const article = await toFilesFormat(articles[0]);
    await build(metadata, data, partials, article);
  }

  if (all) {
    const articleFiles = await Promise.all(articles.map(toFilesFormat));
    const thread = 1024;
    const repeat = Math.ceil(articleFiles.length / thread);

    for (let i = 0; i < repeat; i += 1) {
      const chunk = articleFiles.slice(i * thread, (i + 1) * thread);
      /* eslint-disable-next-line no-await-in-loop */
      await Promise.all(chunk.map(build.bind(null, metadata, data, partials)));
    }
  }

  await Promise.all(files.map(build.bind(null, metadata, data, partials)));
};

main().catch((e) => {
  throw e;
});
