import config from "../config.js";
import fs from "node:fs/promises";
import { guessPath } from "./lib/guess-path.js";
import { outputFile } from "./lib/output-file.js";
import path from "node:path";
import { readJSONFile } from "./lib/json-file.js";
import { renderTemplate } from "./lib/render-template.js";

const toFilesFormat = (file) => ({
  dest: guessPath(file, config.dir.dest, "feed"),
  metadata: guessPath(file, config.dir.metadata, "index.json"),
  template: file,
});

const gatherFiles = async () => {
  const files = await fs.glob(`${config.dir.template}**/_feed.mustache`);
  return Array.fromAsync(files, toFilesFormat);
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

const readData = async (prefix, dataFile) => {
  const basename = path.basename(dataFile, ".json");
  const data = await readJSONFile(dataFile);

  if (!data[0].published) {
    return { [basename]: [] };
  }

  const latest = data.slice(0, 10);
  const extended = await Promise.all(latest.map(extendItem.bind(null, prefix)));
  return { [basename]: extended };
};

const readLatestData = async (prefix) => {
  const dataFiles = await fs.glob(`${config.dir.data}**/*.json`);
  const data = await Array.fromAsync(dataFiles, readData.bind(null, prefix));
  return Object.assign(...data);
};

const mergeData = async (file, metadata, data) => {
  const overrides = await readJSONFile(file.metadata);
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
  const rendered = renderTemplate(template, merged);
  await outputFile(file.dest, rendered);
};

const comparePublished = (a, b) =>
  Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const main = async () => {
  const metadata = await readJSONFile(
    path.join(config.dir.metadata, "root.json"),
  );
  const prefix = `${metadata.scheme}://${metadata.domain}`;
  const [files, { articles, books, links, statuses }] = await Promise.all([
    gatherFiles(),
    readLatestData(prefix),
  ]);
  return Promise.all(
    files.map(
      build.bind(null, metadata, {
        articles,
        books,
        items: [...articles, ...books, ...links, ...statuses]
          .sort(comparePublished)
          // .toSorted(comparePublished)
          .slice(0, 10),
        links,
        statuses,
      }),
    ),
  );
};

main().catch((e) => {
  /* eslint-disable-next-line no-console */
  console.trace(e);
  process.exitCode = 1;
});
