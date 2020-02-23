import axios from "axios";
import config from "./index.js";
import { promises as fs } from "fs";
import minimist from "minimist";
import path from "path";
import { readJSONFile, writeJSONFile } from "../lib/json-file.js";
import runCommand from "../lib/run-command.js";
import sharp from "sharp";
import which from "which";

const main = async () => {
  const argv = minimist(process.argv.slice(2), {
    alias: {
      a: "asin",
      q: "quote",
      t: "title"
    },
    default: {
      asin: "",
      quote: "",
      title: ""
    },
    string: ["asin", "quote", "title"]
  });

  if (!argv.asin || !/^[A-Z0-9]{10}$/i.test(argv.asin)) {
    throw new Error("ASIN code must be passed and must be 10 alphanumeric characters.");
  }

  if (!argv.quote) {
    throw new Error("Book quote must be passed.");
  }

  if (!argv.title) {
    throw new Error("Book title must be passed.");
  }

  const [books, git] = await Promise.all([
    readJSONFile(config.data.books),
    which("git")
  ]);

  if (books.find(book => argv.asin === book.asin)) {
    throw new Error(`${argv.title} has already been added.`);
  }

  const fn = path.join(config.dest.temp, `${argv.asin}.jpg`);
  const res = await axios.get(`https://images-fe.ssl-images-amazon.com/images/P/${argv.asin}.jpg`, {
    responseType: "arraybuffer"
  });
  await fs.writeFile(fn, res.data);
  const metadata = await sharp(fn).metadata();

  await writeJSONFile(config.data.books, [{
    asin: argv.asin,
    height: metadata.height,
    published: Date.now(),
    quote: argv.quote,
    title: argv.title,
    width: metadata.width
  }, ...books]);
  await runCommand(git, ["add", "--", config.data.books]);
  await runCommand(git, ["commit", `--message=Read ${argv.asin}`]);
};

main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
