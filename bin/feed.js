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
  const filesIterator = fs.glob(
    `${config.dir.template}**/_feed.xml.mustache`,
  );
  const templates = await Array.fromAsync(filesIterator);
  return Promise.all(templates.map(toFilesFormat));
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
        /(href|src)="(\/.*?)"/gu,
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

  if (!data[0].published) {
    return { [basename]: [] };
  }

  const latest = data.slice(0, 10);
  const extended = await Promise.all(latest.map(extendItem.bind(null, prefix)));
  return { [basename]: extended };
};

const readAllData = async (prefix) => {
  const filesIterator = fs.glob(`${config.dir.data}**/*.json`);
  const dataFiles = await Array.fromAsync(filesIterator);
  const data = await Promise.all(
    dataFiles.map(readLatestData.bind(null, prefix)),
  );
  return Object.assign(...data);
};

const mergeData = async (file, metadata, data) => {
  const overrides = await fs.readFile(file.metadata).then(JSON.parse);
  return {
    ...metadata,
    ...data,
    ...overrides,
  };
};

const build = async (metadata, data, file) => {
  const [merged, template] = await Promise.all([
    mergeData(file, metadata, data),
    fs.readFile(file.template, "utf8"),
  ]);
  const rendered = mustache.render(template, merged, null, {
    escape: escapeCharacters,
  });
  await fs.mkdir(path.dirname(file.dest), { recursive: true });
  await fs.writeFile(file.dest, rendered);
};

const comparePublished = (a, b) =>
  Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const prefix = `${config.scheme}://${config.domain}`;
const [files, { articles, books, links, statuses }] = await Promise.all([
  gatherFiles(),
  readAllData(prefix),
]);
await Promise.all(
  files.map(
    build.bind(null, config, {
      articles,
      books,
      items: [...articles, ...books, ...links, ...statuses]
        .toSorted(comparePublished)
        .slice(0, 10),
      links,
      statuses,
    }),
  ),
);
