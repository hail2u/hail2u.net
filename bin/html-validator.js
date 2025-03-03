import config from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import util from "node:util";

const selectRandomItem = (array) =>
  array[Math.floor(Math.random() * array.length)].link;

const listArticle = (articles, latest) => {
  if (latest) {
    return [articles.at(0).link];
  }

  return Array(3).fill(0).map(selectRandomItem.bind(null, articles));
};

const cancelFetch = (abortController) => {
  abortController.abort();
};

const validateHTML = async (html) => {
  const body = new FormData();
  body.append("level", "error");
  body.append("out", "json");
  body.append("content", html);
  const abortController = new AbortController();
  const abortID = setTimeout(cancelFetch.bind(null, abortController), 10000);

  try {
    const res = await fetch("https://validator.w3.org/nu/", {
      body,
      method: "POST",
      signal: abortController.signal,
    });

    if (!res.ok) {
      return `Skipped. ${res.status} ${res.statusText}.`;
    }

    const json = await res.json();

    if (json.messages.length === 0) {
      return null;
    }

    return json.messages;
  } catch (e) {
    if (e.name === "AbortError") {
      return "Skipped. Nu HTML Checker does not respond in 10s.";
    }

    throw e;
  } finally {
    clearTimeout(abortID);
  }
};

const formatMessage = (file, { lastColumn, lastLine, message }) =>
  `${file}:${lastLine}:${lastColumn}: ${message}`;

const validate = async (link) => {
  const file = path.join(config.dir.dest, link);
  const html = await fs.readFile(file, "utf8");
  const messages = await validateHTML(html);

  if (!messages) {
    return [];
  }

  if (typeof messages === "string") {
    process.stdout.write(`${file}:1:1: ${messages}
`);
    return [];
  }

  return Promise.all(messages.map(formatMessage.bind(null, file)));
};

const isNotEmpty = (element) => element.length !== 0;

const file = path.join(config.dir.data, "articles.json");
const [
  articles,
  {
    values: { latest },
  },
] = await Promise.all([
  fs.readFile(file, "utf8").then(JSON.parse),
  util.parseArgs({ options: { latest: { type: "boolean" } } }),
]);
const links = listArticle(articles, latest);
const results = await Promise.all(
  [
    "/index.html",
    "/blog/index.html",
    "/bookshelf/index.html",
    "/links/index.html",
    "/projects/index.html",
    "/subscriptions/index.html",
    ...links,
  ].map(validate),
);
const errors = results.flat();

if (errors.length > 0) {
  const errorFiles = results.filter(isNotEmpty);
  process.stdout.write(errors.join("\n"));
  process.stdout.write("\n\n");
  throw new Error(`${errors.length} error(s) in ${errorFiles.length} file(s).`);
}
