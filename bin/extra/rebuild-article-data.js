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
  const [description] = unescapeReferences(body.replace(/<.*?>/gu, ""))
    .trim()
    .split("\n");
  const dt = getDateDetails(published);
  const shortDescription = `${description.split("。")[0]}。`;
  const type = "article";
  return {
    body,
    description,
    link,
    published,
    shortDescription,
    ...dt,
    title,
    type,
  };
};

const file = path.join(config.dir.data, "articles.json");
const articles = await fs.readFile(file, "utf8").then(JSON.parse);
const newArticles = await Promise.all(articles.map(rebuildArticle));
const formatted = JSON.stringify(newArticles, null, 2);
await fs.mkdir(path.dirname(file), { recursive: true });
await fs.writeFile(file, `${formatted}\n`);
