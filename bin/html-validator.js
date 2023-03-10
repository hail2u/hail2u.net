import {
  formatMessage,
  validateHTML,
  writeErrors
} from "./lib/validate-html.js";
import config from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import { shuffleArray } from "./lib/shuffle-array.js";

const rewritePath = ([
    ,
    relative
  ]) => {
  if (relative.endsWith("/")) {
    return path.join(config.dir.dest, relative, "index.html");
  }

  return path.join(config.dir.dest, relative);
};

const validate = async (file) => {
  const html = await fs.readFile(file, "utf8");
  const messages = await validateHTML(html);

  if (!messages) {
    return [];
  }

  return Promise.all(messages.map(formatMessage.bind(null, file, 0)));
};

const isNotEmpty = (element) => element.length !== 0;

const main = async () => {
  const sitemap = await fs.readFile(path.join(config.dir.dest, "sitemap.xml"), "utf8");
  const indexes = Array.from(sitemap.matchAll(/<loc>https:\/\/.*?\/(.*?\/)<\/loc>/gu), rewritePath);
  const articles = Array.from(sitemap.matchAll(/<loc>https:\/\/.*?\/(blog\/.*?\.html)<\/loc>/gu), rewritePath);
  const picked = shuffleArray(articles).slice(0, 3);
  const results = await Promise.all([
    ...indexes,
    ...picked
  ].map(validate));
  const errors = results.flat();

  if (errors.length > 0) {
    const errorFiles = results.filter(isNotEmpty);
    writeErrors(errors, errorFiles);
  }
};

main().catch((e) => {
  /* eslint-disable-next-line no-console */
  console.trace(e);
  process.exitCode = 1;
});
