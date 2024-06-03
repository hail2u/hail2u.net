import { outputJSONFile, readJSONFile } from "../lib/json-file.js";
import config from "../../config.js";
import fs from "node:fs/promises";
import { getDateDetails } from "../lib/get-date-details.js";
import path from "node:path";
import { unescapeReferences } from "../lib/character-reference.js";

const rebuildArticle = async (article) => {
  const { link, published } = article;
  const html = await fs.readFile(path.join(config.dir.data, link), "utf8");
  const [first, ...rest] = html.split("\n");
  const body = rest.join("\n").trim();
  const title = unescapeReferences(first.replace(/<.*?>/gu, ""));
  const image = /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/u.exec(body);
  const [description] = unescapeReferences(body.replace(/<.*?>/gu, ""))
    .trim()
    .split("\n");
  const dt = getDateDetails(published);
  const type = "article";

  if (!image) {
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
    cover: image[1],
    description,
    link,
    published,
    ...dt,
    title,
    twitterCard: "summary_large_image",
    type,
  };
};

const main = async () => {
  const file = path.join(config.dir.data, "articles.json");
  const articles = await readJSONFile(file);
  const newArticles = await Promise.all(articles.map(rebuildArticle));
  await outputJSONFile(file, newArticles);
};

main().catch((e) => {
  throw e;
});
