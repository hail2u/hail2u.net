import config from "../config.js";
import fs from "node:fs/promises";
import { getDateDetails } from "./lib/get-date-details.js";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import { selectDraft } from "./lib/select-draft.js";
import { unescapeReferences } from "./lib/character-reference.js";

const checkIDFormat = (id) => {
  if (!id) {
    throw new Error("A draft must have an ID.");
  }

  if (!/[0-9a-z][\-.0-9a-z]*[0-9a-z]/v.test(id)) {
    throw new Error(
      "This draft ID is not valid. ID must start and end with “0-9” or “a-z”, and must not contain other than “-.a-z0-9”.",
    );
  }
};

const checkTitleType = (title) => {
  if (typeof title !== "string") {
    throw new Error(
      "This draft does not have a valid title. A draft title must be a string.",
    );
  }
};

const isDuplication = (id, element) => element.link.endsWith(`${id}.html`);

const checkDuplication = (id, articles) => {
  if (articles.findIndex(isDuplication.bind(null, id)) !== -1) {
    throw new Error(`There has been a entry that has same ID “${id}”.`);
  }
};

const buildArticle = ({ body, id, title }) => {
  const firstParagraph = body.replace(/<.*?>/gv, "").trim().split("\n").at(0);
  const description = unescapeReferences(firstParagraph);
  const published = Date.now();
  const dt = getDateDetails(published);
  return {
    body,
    description,
    link: `/blog/${id}.html`,
    published,
    ...dt,
    shortDescription: description.split(/(?<=。)/v).at(0),
    title,
    type: "article",
  };
};

const isNotGeneratedID = (id) => !/^\d{4}-\d{2}-\d{2}$/v.test(id);

const selected = await selectDraft();
checkIDFormat(selected.id);
checkTitleType(selected.title);
const file = path.join(config.dir.data, config.data.articles);
const articles = await fs.readFile(file).then(JSON.parse);
checkDuplication(selected.id, articles);
const body = selected.body.replace(
  /(?<=\b(href|src|srcset)=")\.\/dist\//gv,
  "/",
);
const article = buildArticle({
  ...selected,
  body,
});
const formatted = JSON.stringify([article, ...articles], null, "  ");
await fs.mkdir(path.dirname(file), {
  recursive: true,
});
await fs.writeFile(file, `${formatted}\n`);
await runCommand("git", ["add", "--", file]);
const th = articles.length + 1;
await runCommand("git", [
  "commit",
  `--message=Contribute ${article.link} (${th})`,
]);

if (isNotGeneratedID(selected.id)) {
  const twitter = new URL("https://x.com/intent/tweet");
  twitter.searchParams.append(
    "text",
    `${article.shortDescription} / ${article.title} ${config.scheme}://${config.domain}${article.link}`,
  );
  await runCommand("chrome", [twitter.href]);
}
