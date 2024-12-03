import {
  escapeCharacters,
  unescapeReferences,
} from "./lib/character-reference.js";
import config from "../config.js";
import fs from "node:fs/promises";
import { getDateDetails } from "./lib/get-date-details.js";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import { selectDraft } from "./lib/select-draft.js";

const checkIDFormat = (id) => {
  if (!id) {
    throw new Error("A draft must have an ID.");
  }

  if (id && !/[0-9a-z][-.0-9a-z]*[0-9a-z]/u.test(id)) {
    throw new Error(
      "This draft ID is not valid. ID must start and end with “0-9” or “a-z”, and must not contain other than “-.a-z0-9”.",
    );
  }
};

const checkIDConflict = async (id) => {
  const file = path.join(config.dir.dest, "blog", `${id}.html`);
  const exists = await fs
    .access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

  if (exists) {
    throw new Error(`“${id}” is already used.`);
  }
};

const checkTitleType = (title) => {
  if (typeof title !== "string") {
    throw new Error(
      "This draft does not have a valid title. A draft title must be a string.",
    );
  }
};

const buildArticle = async (selected) => {
  const { body, id, title } = selected;
  await Promise.all([
    checkIDFormat(id),
    checkIDConflict(id),
    checkTitleType(title),
  ]);
  const [description] = unescapeReferences(body.replace(/<.*?>/gu, ""))
    .trim()
    .split("\n");
  const link = path.posix.join("/", "blog", `${id}.html`);
  const published = Date.now();
  const dt = getDateDetails(published);
  const shortDescription = `${description.split("。")[0]}。`;
  const type = "article";
  return {
    body,
    description: `${description}`,
    link,
    published,
    ...dt,
    shortDescription,
    title,
    type,
  };
};

const file = path.join(config.dir.data, "articles.json");
const [selected, articles] = await Promise.all([
  selectDraft(),
  fs.readFile(file).then(JSON.parse),
]);
const body = selected.body.replace(
  /(?<=\b(href|src|srcset)=")\.\/dist\//gu,
  "/",
);
const article = await buildArticle({
  ...selected,
  body,
});
const articleFile = path.join(config.dir.data, article.link);
await fs.mkdir(path.dirname(articleFile), { recursive: true });
const escapedTitle = escapeCharacters(article.title);
const formatted = JSON.stringify([article, ...articles], null, 2);
await fs.mkdir(path.dirname(file), { recursive: true });
await Promise.all([
  fs.writeFile(file, `${formatted}\n`),
  fs.writeFile(
    articleFile,
    `<h1>${escapedTitle}</h1>

${body}
`,
  ),
]);
await runCommand("git", ["add", "--", file, articleFile]);
const th = articles.length + 1;
await runCommand("git", [
  "commit",
  `--message=Contribute ${article.link} (${th})`,
]);
const twitter = new URL("https://x.com/intent/tweet");
twitter.searchParams.append(
  "text",
  `${article.shortDescription} / ${article.title} ${config.scheme}://${config.domain}${article.link}`,
);
await runCommand("open", [twitter.href]);
