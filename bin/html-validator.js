import config from "../config.js";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import util from "node:util";

const selectRandomItem = (array) =>
  array.at(Math.floor(Math.random() * array.length)).link;

const listArticle = (articles, latest, preview) => {
  if (latest) {
    return [articles.at(0).link];
  }

  if (preview) {
    return [config.file.preview];
  }

  return Array(config.test.articles)
    .fill(0)
    .map(selectRandomItem.bind(null, articles));
};

const toPath = (file) => path.join(config.dir.dest, file);

const addIndexes = (links, preview) => {
  if (preview) {
    return links;
  }

  return [
    "/index.html",
    "/blog/index.html",
    "/bookshelf/index.html",
    "/links/index.html",
    "/projects/index.html",
    "/subscriptions/index.html",
    "/statuses/index.html",
    ...links,
  ].map(toPath);
};

const execFileAsync = util.promisify(execFile);

const isNotCSSError = ({ message }) => {
  if (message.startsWith("CSS:")) {
    return false;
  }

  return true;
};

const handleError = (err) => {
  const { messages } = JSON.parse(err.stderr);
  const errors = messages.filter(isNotCSSError);

  if (errors.length === 0) {
    return;
  }

  for (const { lastColumn, lastLine, message, url } of errors) {
    const absolute = url.replace(/file:/u, "");
    const relative = path.relative(".", absolute);
    process.stderr.write(`${relative}:${lastLine}:${lastColumn}: ${message}`);
    process.stderr.write("\n");
  }

  process.stderr.write("\n");
  throw new Error(`Validation ends with ${errors.length} error(s)`);
};

const {
  values: { latest, preview },
} = util.parseArgs({
  options: {
    latest: {
      type: "boolean",
    },
    preview: {
      type: "boolean",
    },
  },
});

if (latest && preview) {
  throw new Error("--latest and --preview are not used at the same time");
}

const file = path.join(config.dir.data, config.data.articles);
const articles = await fs.readFile(file, "utf8").then(JSON.parse);
const links = listArticle(articles, latest, preview);
const files = addIndexes(links, preview);
execFileAsync("vnu", ["--errors-only", "--format", "json", ...files]).catch(
  handleError,
);
