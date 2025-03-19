import config from "../config.js";
import { escapeCharacters } from "./lib/character-reference.js";
import fs from "node:fs/promises";
import { getDateDetails } from "./lib/get-date-details.js";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import sharp from "sharp";
import util from "node:util";

const isReadBook = (asin, { link }) => link.includes(`/${asin}/`);

const cancelFetch = (abortController) => {
  abortController.abort();
};

const {
  values: { asin, author, title },
} = util.parseArgs({
  options: {
    asin: {
      type: "string",
    },
    author: {
      type: "string",
    },
    title: {
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

const file = path.join(config.dir.data, config.data.books);
const books = await fs.readFile(file, "utf8").then(JSON.parse);

if (books.find(isReadBook.bind(null, asin))) {
  throw new Error(`${title} has already been added.`);
}

const abortController = new AbortController();
const abortID = setTimeout(cancelFetch.bind(null, abortController), 5000);

try {
  const cover = `https://m.media-amazon.com/images/P/${asin}.jpg`;
  const res = await fetch(cover, {
    signal: abortController.signal,
  });

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
  const formatted = JSON.stringify(
    [
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
    ],
    null,
    2,
  );
  await fs.mkdir(path.dirname(file), {
    recursive: true,
  });
  await fs.writeFile(file, `${formatted}\n`);
  await runCommand("git", ["add", "--", file]);
  await runCommand("git", ["commit", `--message=Read ${asin}`]);
  const twitter = new URL("https://x.com/intent/tweet");
  twitter.searchParams.append("text", `${title} / ${author} ${link}`);
  await runCommand("open", [twitter.href]);
} catch (e) {
  if (e.name === "AbortError") {
    throw new Error("Amazon image server does not respond in 5s.");
  }

  throw e;
} finally {
  clearTimeout(abortID);
}
