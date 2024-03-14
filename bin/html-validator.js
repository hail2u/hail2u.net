import config from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import { shuffleArray } from "./lib/shuffle-array.js";
import util from "node:util";

const rewritePath = ([, relative]) => {
  if (relative.endsWith("/")) {
    return path.join(config.dir.dest, relative, "index.html");
  }

  return path.join(config.dir.dest, relative);
};

const isNormalHTML = (file) => !file.endsWith("/statuses/index.html");

const listArticle = (sitemap, latest) => {
  const articles = Array.from(
    sitemap.matchAll(/<loc>https:\/\/.*?\/(blog\/.*?\.html)<\/loc>/gu),
    rewritePath,
  );

  if (latest) {
    return articles.slice(0, 1);
  }

  return shuffleArray(articles).slice(0, 3);
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

const validate = async (file) => {
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

const main = async () => {
  const [
    sitemap,
    {
      values: { latest },
    },
  ] = await Promise.all([
    fs.readFile(path.join(config.dir.dest, "sitemap.xml"), "utf8"),
    util.parseArgs({
      options: {
        latest: {
          short: "l",
          type: "boolean",
        },
      },
    }),
  ]);
  const indexes = Array.from(
    sitemap.matchAll(/<loc>https:\/\/.*?\/(.*?\/)<\/loc>/gu),
    rewritePath,
  ).filter(isNormalHTML);
  const articles = listArticle(sitemap, latest);
  const results = await Promise.all([...indexes, ...articles].map(validate));
  const errors = results.flat();

  if (errors.length > 0) {
    const errorFiles = results.filter(isNotEmpty);
    process.stdout.write(errors.join("\n"));
    process.stdout.write("\n\n");
    throw new Error(
      `${errors.length} error(s) in ${errorFiles.length} file(s).`,
    );
  }
};

main().catch((e) => {
  /* eslint-disable-next-line no-console */
  console.trace(e);
  process.exitCode = 1;
});
