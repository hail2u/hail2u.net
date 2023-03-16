import { outputJSONFile, readJSONFile } from "./lib/json-file.js";
import config from "../config.js";
import fs from "node:fs/promises";
import { getDateDetails } from "./lib/get-date-details.js";
import path from "node:path";
import { unescapeReferences } from "./lib/character-reference.js";

const buildArticle = (
  { cover, link, published, twitterCard, type },
  body,
  title
) => {
  const description = unescapeReferences(body.replace(/<.*?>/gu, ""))
    .trim()
    .split("\n")
    .shift();
  const dt = getDateDetails(published);

  if (!cover) {
    return {
      body,
      description,
      link,
      published,
      ...dt,
      title,
      type,
    };
  }

  return {
    body,
    cover,
    description,
    link,
    published,
    ...dt,
    title,
    twitterCard,
    type,
  };
};

const readArticle = async (article) => {
  const html = await fs.readFile(
    path.join(config.dir.data, article.link),
    "utf8"
  );
  const [first, ...rest] = html.split("\n");
  return buildArticle(
    article,
    rest.join("\n").trim(),
    unescapeReferences(first.replace(/<.*?>/gu, ""))
  );
};

const main = async () => {
  const file = path.join(config.dir.data, "articles.json");
  const articles = await readJSONFile(file);
  const newArticles = await Promise.all(articles.map(readArticle));
  await outputJSONFile(file, newArticles);
};

main().catch((e) => {
  /* eslint-disable-next-line no-console */
  console.trace(e);
  process.exitCode = 1;
});
