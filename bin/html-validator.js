import config from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import util from "node:util";

const selectRandomItem = (array) => {
  const { link } = array.at(Math.floor(Math.random() * array.length));
  return path.join(config.dir.dest, link);
};

const pickArticle = (articles, latest, preview) => {
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

const addIndexes = async (links, latest, preview) => {
  if (latest || preview) {
    return links;
  }

  const indexes = await Array.fromAsync(
    fs.glob(`${config.dir.dest}**/index.html`, {
      exclude: ["*/style-guide/*"],
    }),
  );
  return [...indexes, ...links];
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
  const abortID = setTimeout(
    cancelFetch.bind(null, abortController),
    config.test.timeout,
  );

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
      return `Skipped. Nu HTML Checker does not respond in ${config.test.timeout}ms.`;
    }

    throw e;
  } finally {
    clearTimeout(abortID);
  }
};

const formatMessage = (file, { lastColumn, lastLine, message }) =>
  `${file}:${lastLine}:${lastColumn}: ${message}`;

const validate = async (file) => {
  const html = await fs.readFile(file, "utf8");
  const messages = await validateHTML(html);

  if (!messages) {
    return [];
  }

  if (typeof messages === "string") {
    process.stderr.write(`${file}:1:1: ${messages}
`);
    return [];
  }

  return Promise.all(messages.map(formatMessage.bind(null, file)));
};

const isNotEmpty = (element) => element.length !== 0;

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
const file = path.join(config.dir.data, config.data.articles);
const articles = await fs.readFile(file, "utf8").then(JSON.parse);
const links = pickArticle(articles, latest, preview);
const files = await addIndexes(links, latest, preview);
const results = await Promise.all(files.map(validate));
const errors = results.flat();

if (errors.length > 0) {
  const errorFiles = results.filter(isNotEmpty);
  process.stderr.write(errors.join("\n"));
  process.stderr.write("\n\n");
  throw new Error(`${errors.length} error(s) in ${errorFiles.length} file(s).`);
}
