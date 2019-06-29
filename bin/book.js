const minimist = require("minimist");
const path = require("path");
const { readJSONFile, writeJSONFile } = require("../lib/json");
const runCommand = require("../lib/run-command");
const whichAsync = require("../lib/which-async");

const argv = minimist(process.argv.slice(2), {
  alias: {
    a: "asin",
    t: "title",
    y: "type"
  },
  default: {
    asin: "",
    title: "",
    type: ""
  },
  string: ["asin", "title", "type"]
});
const comicsFile = "../src/bookshelf/comics.json";
const nonfictionsFile = "../src/bookshelf/nonfictions.json";
const novelsFile = "../src/bookshelf/novels.json";

const selectBooksFile = type => {
  if (type === "comic") {
    return comicsFile;
  }

  if (type === "novel") {
    return novelsFile;
  }

  if (type === "nonfiction") {
    return nonfictionsFile;
  }

  throw new Error("Book type must be one of comic, novel, and nonfiction.");
};

const main = async () => {
  if (!argv.asin) {
    throw new Error("ASIN code must be passed.");
  }

  if (!/^[A-Z0-9]{10}$/i.test(argv.asin)) {
    throw new Error("ASIN must be 10 alphanumeric characters.");
  }

  if (!argv.title) {
    throw new Error("Book title must be passed.");
  }

  if (!argv.type) {
    throw new Error("Book type must be passed.");
  }

  const booksFile = selectBooksFile(argv.type);
  const [books, git] = await Promise.all([
    readJSONFile(booksFile),
    whichAsync("git")
  ]);

  if (books.find(book => argv.asin === book.asin)) {
    throw new Error(`${argv.title} had been added.`);
  }

  await writeJSONFile(booksFile, [{
    asin: argv.asin,
    published: Date.now(),
    title: argv.title
  }, ...books]);
  await runCommand(git, ["add", "--", path.relative("", booksFile)]);
  await runCommand(git, ["commit", `--message=Read ${argv.asin}`]);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
