import { outputJSONFile, readJSONFile } from "./lib/json-file.js";
import config from "../config.js";
import { escapeCharacters } from "./lib/character-reference.js";
import { getDateDetails } from "./lib/get-date-details.js";
import { openTwitter } from "./lib/open-twitter.js";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import sharp from "sharp";
import util from "node:util";

const isReadBook = (title, book) => title === book.title;

const cancelFetch = (abortController) => {
  abortController.abort();
};

const main = async () => {
  const {
    values: { asin, author, title },
  } = util.parseArgs({
    options: {
      asin: {
        short: "a",
        type: "string",
      },
      author: {
        short: "u",
        type: "string",
      },
      title: {
        short: "t",
        type: "string",
      },
    },
  });

  if (!asin) {
    throw new Error("--asin is required.");
  }

  if (!author) {
    throw new Error("--author is required.");
  }

  if (!title) {
    throw new Error("--title is required.");
  }

  if (!/^[A-Z0-9]{10}$/iu.test(asin)) {
    throw new Error(`${asin} is not consisted of 10 alphanumeric characters.`);
  }

  const file = path.join(config.dir.data, "books.json");
  const books = await readJSONFile(file);

  if (books.find(isReadBook.bind(null, title))) {
    throw new Error(`${title} has already been added.`);
  }

  const abortController = new AbortController();
  const abortID = setTimeout(cancelFetch.bind(null, abortController), 5000);

  try {
    const cover = `https://m.media-amazon.com/images/P/${asin}.jpg`;
    const res = await fetch(cover, { signal: abortController.signal });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const img = await res.arrayBuffer();
    const metadata = await sharp(Buffer.from(img)).metadata();

    if (metadata.height === 1 && metadata.width === 1) {
      throw new Error(`${title} does not have a cover image.`);
    }

    const link = `https://www.amazon.co.jp/exec/obidos/ASIN/${asin}/hail2unet-22`;
    const titleEscaped = escapeCharacters(title);
    const body = `<a href="${link}"><img alt="${titleEscaped}" height="${metadata.height}" loading="lazy" src="${cover}" width="${metadata.width}"></a>`;
    const published = Date.now();
    const dt = getDateDetails(published);
    await outputJSONFile(file, [
      {
        body,
        description: author,
        link,
        published,
        ...dt,
        title,
        type: "book",
      },
      ...books,
    ]);
    await runCommand("git", ["add", "--", file]);
    await runCommand("git", ["commit", `--message=Read ${asin}`]);
    const url = `https://www.amazon.co.jp/exec/obidos/ASIN/${asin}/hail2unet-22`;
    await openTwitter(`${url}`);
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error("Amazon image server does not respond in 5s.");
    }

    throw e;
  } finally {
    clearTimeout(abortID);
  }
};

main().catch((e) => {
  /* eslint-disable-next-line no-console */
  console.trace(e);
  process.exitCode = 1;
});
