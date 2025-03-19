import config from "../config.js";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import util from "node:util";

const selectRandomItem = (array) =>
  array.at(Math.floor(Math.random() * array.length)).link;

const listArticle = (articles, latest) => {
  if (latest) {
    return [articles.at(0).link];
  }

  return Array(3).fill(0).map(selectRandomItem.bind(null, articles));
};

const toPath = (file) => path.join(config.dir.dest, file);

const execFileAsync = util.promisify(execFile);

const handleError = (err) => {
  const { messages } = JSON.parse(err.stderr);

  for (const { lastColumn, lastLine, message, url } of messages) {
    const absolute = url.replace(/file:/u, "");
    const relative = path.relative(".", absolute);
    process.stderr.write(`${relative}:${lastLine}:${lastColumn}: ${message}`);
    process.stderr.write("\n");
  }

  process.stderr.write("\n");
  throw new Error(`Validation ends with ${messages.length} error(s)`);
};

const file = path.join(config.dir.data, config.data.articles);
const articles = await fs.readFile(file, "utf8").then(JSON.parse);
const {
  values: { latest },
} = util.parseArgs({
  options: {
    latest: {
      type: "boolean",
    },
  },
});
const links = listArticle(articles, latest);
const files = [
  "/index.html",
  "/blog/index.html",
  "/bookshelf/index.html",
  "/links/index.html",
  "/projects/index.html",
  "/subscriptions/index.html",
  "/statuses/index.html",
  ...links,
].map(toPath);
execFileAsync("vnu", ["--errors-only", "--format", "json", ...files]).catch(
  handleError,
);
