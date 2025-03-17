import config from "../config.js";
import { escapeCharacters } from "./lib/character-reference.js";
import fs from "node:fs/promises";
import { guessPath } from "./lib/guess-path.js";
import mustache from "mustache";
import path from "node:path";
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

  const nextItem = items.at(index + 1);

  if (index === 0) {
    return {
      ...item,
      isFirstInDate: true,
      isFirstInMonth: true,
      isFirstInYear: true,
      isLastInDate: isLastInDate(item, nextItem),
      isLastInMonth: isLastInMonth(item, nextItem),
      isLastInYear: isLastInYear(item, nextItem),
    };
  }

  const previousItem = items.at(index - 1);
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
  const data = await fs.readFile(file).then(JSON.parse);
  const marked = await Promise.all(data.map(markItem));
  return { [basename]: marked };
};

const readAllData = async () => {
  const filesIterator = fs.glob(`${config.dir.data}**/*.json`);
  const dataFiles = await Array.fromAsync(filesIterator);
  const data = await Promise.all(dataFiles.map(readData));
  const allData = Object.assign(...data);
  return {
    ...allData,
    version: config.version,
  };
};

const readPartial = async (file) => {
  const basename = path.basename(file, ".mustache").substring(1);
  const partial = await fs.readFile(file, "utf8");
  return { [basename]: partial };
};

const readPartials = async () => {
  const filesIterator = fs.glob(`${config.dir.template}partials/*.mustache`);
  const templates = await Array.fromAsync(filesIterator);
  const partials = await Promise.all(templates.map(readPartial));
  return Object.assign(...partials);
};

const startsWithUnderscore = (file) => {
  const filename = file.split("/").at(-1);
  return filename.startsWith("_");
};

const guessTemplateName = ({ type, published }) => {
  if (
    type === "article" &&
    published < Date.now() - 1000 * 60 * 60 * 24 * 365
  ) {
    return "_old.html.mustache";
  }

  return "_article.html.mustache";
};

const toFilesFormat = (template) => {
  if (typeof template === "object") {
    const articleTemplate = path.join(
      config.dir.template,
      "blog",
      guessTemplateName(template),
    );
    return {
      ...template,
      dest: path.join(config.dir.dest, template.link),
      metadata: guessPath(articleTemplate, config.dir.metadata, "article.json"),
      template: articleTemplate,
    };
  }

  const basename = path.basename(template, path.extname(template));
  const doubleExt = path.extname(basename);
  return {
    dest: guessPath(template, config.dir.dest, basename),
    metadata: guessPath(
      template,
      config.dir.metadata,
      basename.replace(doubleExt, ".json"),
    ),
    template,
  };
};

const gatherFiles = async () => {
  const filesIterator = fs.glob(`${config.dir.template}**/*.mustache`, {
    exclude: startsWithUnderscore,
  });
  const templates = await Array.fromAsync(filesIterator);
  return Promise.all(templates.map(toFilesFormat));
};

const hasSameLink = (dest, { link }) => dest.endsWith(link);

const mergeData = async (file, metadata, data) => {
  const overrides = await fs.readFile(file.metadata).then(JSON.parse);

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
      homeBooks: data.books.slice(0, 6),
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
  const rendered = mustache.render(template, merged, partials, {
    escape: escapeCharacters,
  });
  await fs.mkdir(path.dirname(file.dest), { recursive: true });
  return fs.writeFile(file.dest, rendered);
};

const [
  data,
  partials,
  {
    values: { all, latest },
  },
  files,
] = await Promise.all([
  readAllData(),
  readPartials(),
  util.parseArgs({
    options: {
      all: {
        type: "boolean",
      },
      latest: {
        type: "boolean",
      },
    },
  }),
  gatherFiles(),
]);

if (latest) {
  const article = await toFilesFormat(data.articles.at(0));
  await build(config, data, partials, article);
}

if (all) {
  const articleFiles = await Promise.all(data.articles.map(toFilesFormat));
  const thread = 1024;
  const repeat = Math.ceil(articleFiles.length / thread);

  for (let i = 0; i < repeat; i += 1) {
    const chunk = articleFiles.slice(i * thread, (i + 1) * thread);
    /* eslint-disable-next-line no-await-in-loop */
    await Promise.all(chunk.map(build.bind(null, config, data, partials)));
  }
}

await Promise.all(files.map(build.bind(null, config, data, partials)));
