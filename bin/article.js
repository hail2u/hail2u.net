import {
  formatMessage,
  validateHTML,
  writeErrors
} from "./lib/validate-html.js";
import {
  outputJSONFile,
  readJSONFile
} from "./lib/json-file.js";
import config from "../config.js";
import fs from "node:fs/promises";
import { getDateDetails } from "./lib/get-date-details.js";
import { openTwitter } from "./lib/open-twitter.js";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import { selectDraft } from "./lib/select-draft.js";
import { unescapeReferences } from "./lib/character-reference.js";

const checkIDFormat = (id) => {
  if (!id) {
    throw new Error("A draft must have an ID.");
  }

  if (id && !/[0-9a-z][-.0-9a-z]*[0-9a-z]/u.test(id)) {
    throw new Error("This draft ID is not valid. ID must start and end with “0-9” or “a-z”, and must not contain other than “-.a-z0-9”.");
  }
};

const checkIDConflict = async (id) => {
  const file = path.join(config.dir.dest, "blog", `${id}.html`);

  try {
    await fs.access(file, fs.constants.F_OK);
  } catch (e) {
    return true;
  }

  throw new Error(`“${id}” is already used.`);
};

const checkTitleType = (title) => {
  if (typeof title !== "string") {
    throw new Error("This draft does not have a valid title. A draft title must be a string.");
  }
};

const validateBody = async (body, src) => {
  const messages = await validateHTML(`<!doctype html><title>_</title>${body}`);

  if (!messages) {
    return;
  }

  const errors = await Promise.all(messages.map(formatMessage.bind(null, src, 2)));
  writeErrors(errors, [ src ]);
};

const main = async () => {
  const file = path.join(config.dir.data, "articles.json");
  const [
    selected,
    articles
  ] = await Promise.all([
    selectDraft(),
    readJSONFile(file)
  ]);
  const body = selected.body.replace(/(?<=\b(href|src)=")\.\/dist\//gu, "/");
  const {
    id,
    title
  } = selected;
  await Promise.all([
    checkIDFormat(id),
    checkIDConflict(id),
    checkTitleType(title),
    validateBody(body, config.file.draft)
  ]);
  const description = unescapeReferences(body.replace(/<.*?>/gu, ""))
    .trim()
    .split("\n")
    .shift();
  const link = path.posix.join("/", "blog", `${id}.html`);
  const published = Date.now();
  const dt = getDateDetails(published);
  await outputJSONFile(file, [
    {
      body,
      description,
      link,
      published,
      ...dt,
      title,
      type: "article"
    },
    ...articles
  ]);
  await runCommand("git", [
    "add",
    "--",
    file
  ]);
  const th = articles.length + 1;
  const [{
    domain,
    scheme
  }] = await Promise.all([
    readJSONFile(path.join(config.dir.metadata, "root.json")),
    runCommand("git", [
      "commit",
      `--message=Contribute ${id} (${th})`
    ])
  ]);
  await openTwitter(`${scheme}://${domain}${link}`);
};

main().catch((e) => {
  /* eslint-disable-next-line no-console */
  console.trace(e);
  process.exitCode = 1;
});
