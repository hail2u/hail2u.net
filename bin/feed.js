import config from "../config.js";
import { escapeCharacters } from "./lib/character-reference.js";
import fs from "node:fs/promises";
import { guessPath } from "./lib/guess-path.js";
import mustache from "mustache";
import path from "node:path";

const toFilesFormat = (template) => ({
  dest: guessPath(template, config.dir.dest, "feed"),
  metadata: guessPath(template, config.dir.metadata, "index.json"),
  template,
});

const gatherFiles = async () => {
  const globber = fs.glob(`${config.dir.template}**/_feed.xml.mustache`);
  const files = await Array.fromAsync(globber);
  return Promise.all(files.map(toFilesFormat));
};

const toAbsoluteURL = (prefix, url) => {
  if (!url.startsWith("/")) {
    return url;
  }

  return `${prefix}${url}`;
};

const toAbsoluteURLAll = (prefix, match, attr, url) => {
  const absoluteURL = toAbsoluteURL(prefix, url);
  return `${attr}="${absoluteURL}"`;
};

const extendItem = (prefix, item) => {
  const link = toAbsoluteURL(prefix, item.link);

  if (item.body) {
    return {
      ...item,
      body: item.body.replace(
        /(href|src|srcset)="(\/.*?)"/gu,
        toAbsoluteURLAll.bind(null, prefix),
      ),
      link,
    };
  }

  return {
    ...item,
    link,
  };
};

const readLatestData = async (prefix, dataFile) => {
  const basename = path.basename(dataFile, ".json");
  const data = await fs.readFile(dataFile).then(JSON.parse);
  const extended = await Promise.all(
    data.slice(0, 10).map(extendItem.bind(null, prefix)),
  );
  return {
    [basename]: extended,
  };
};

const readAllData = async () => {
  const globber = fs.glob(`${config.dir.data}**/*.json`);
  const files = await Array.fromAsync(globber);
  const prefix = `${config.scheme}://${config.domain}`;
  const data = await Promise.all(files.map(readLatestData.bind(null, prefix)));
  return Object.assign(...data);
};

const comparePublished = (a, b) =>
  Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const mergeData = async (file, metadata, data) => {
  const overrides = await fs.readFile(file.metadata).then(JSON.parse);
  return {
    ...metadata,
    ...data,
    ...overrides,
  };
};

const build = async (metadata, data, file) => {
  const template = await fs.readFile(file.template, "utf8");
  const merged = await mergeData(file, metadata, data);
  const rendered = mustache.render(template, merged, null, {
    escape: escapeCharacters,
  });
  await fs.mkdir(path.dirname(file.dest), {
    recursive: true,
  });
  await fs.writeFile(file.dest, rendered);
};

const files = await gatherFiles();
const { articles, books, links, statuses } = await readAllData();
const items = [...articles, ...books, ...links, ...statuses]
  .toSorted(comparePublished)
  .slice(0, 10);
const data = {
  articles,
  books,
  items,
  links,
  statuses,
};
await Promise.all(files.map(build.bind(null, config, data)));
