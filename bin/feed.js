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

const gatherFiles = () => {
  const globber = fs.glob(`${config.dir.template}**/_feed.xml.mustache`);
  return Array.fromAsync(globber, toFilesFormat);
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

const extendItem = (item) => {
  const prefix = `${config.scheme}://${config.domain}`;
  const link = toAbsoluteURL(prefix, item.link);

  if (item.body) {
    return {
      ...item,
      body: item.body.replace(
        /(href|src|srcset)="(\/.*?)"/gv,
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

const readLatestData = async (file) => {
  const basename = path.basename(file, ".json");
  const data = await fs.readFile(file).then(JSON.parse);
  const latestData = data.slice(0, 10);
  const extended = await Promise.all(latestData.map(extendItem));
  return {
    [basename]: extended,
  };
};

const readAllData = async () => {
  const globber = fs.glob(`${config.dir.data}**/*.json`);
  const data = await Array.fromAsync(globber, readLatestData);
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
