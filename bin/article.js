import {
  escapeCharacters,
  unescapeReferences,
} from "./lib/character-reference.js";
import { outputJSONFile, readJSONFile } from "./lib/json-file.js";
import config from "../config.js";
import fs from "node:fs/promises";
import { getDateDetails } from "./lib/get-date-details.js";
import { openTwitter } from "./lib/open-twitter.js";
import { outputFile } from "./lib/output-file.js";
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
  const image = /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/u.exec(body);
  const [description] = unescapeReferences(body.replace(/<.*?>/gu, ""))
    .trim()
    .split("\n");
  const link = path.posix.join("/", "blog", `${id}.html`);
  const published = Date.now();
  const dt = getDateDetails(published);
  const shortDescription = `${description.split("。")[0]}。`;
  const type = "article";

  if (!image) {
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
  }

  return {
    body,
    cover: image[1],
    description,
    link,
    published,
    ...dt,
    shortDescription,
    title,
    twitterCard: "summary_large_image",
    type,
  };
};

const buildText = (article, domain, scheme) => {
  const url = `${scheme}://${domain}${article.link}`;

  if (article.twitterCard === "summary_large_image") {
    return `${article.shortDescription} ${url}`;
  }

  return url;
};

const main = async () => {
  const file = path.join(config.dir.data, "articles.json");
  const [selected, articles] = await Promise.all([
    selectDraft(),
    readJSONFile(file),
  ]);
  const body = selected.body.replace(
    /(?<=\b(href|src|srcset)=")\.\/dist\//gu,
    "/",
  );
  const article = await buildArticle({
    ...selected,
    body,
  });
  const dataFile = path.join(config.dir.data, article.link);
  const escapedTitle = escapeCharacters(article.title);
  await Promise.all([
    outputJSONFile(file, [article, ...articles]),
    outputFile(
      dataFile,
      `<h1>${escapedTitle}</h1>

${body}
`,
    ),
  ]);
  await runCommand("git", ["add", "--", file, dataFile]);
  const th = articles.length + 1;
  const [{ domain, scheme }] = await Promise.all([
    readJSONFile(path.join(config.dir.metadata, "root.json")),
    runCommand("git", [
      "commit",
      `--message=Contribute ${article.link} (${th})`,
    ]),
  ]);
  const text = buildText(article, domain, scheme);
  await openTwitter(text);
};

main().catch((e) => {
  throw e;
});
