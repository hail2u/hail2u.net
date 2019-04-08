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

  if (type === "novel") {
    return nonfictionsFile;
  }

  throw new Error("Book type must be one of comic, novel, and nonfiction.");
};

const addBook = async (asin, title, type, git) => {
  if (!/^[A-Z0-9]{10}$/i.test(asin)) {
    throw new Error("ASIN must be 10 alphanumeric characters.");
  }

  const booksFile = selectBooksFile(type);
  const books = await readJSONFile(booksFile);
  await writeJSONFile(booksFile, [{
    asin: asin,
    published: Date.now(),
    title: title
  }, ...books]);
  await runCommand(git, ["add", "--", path.relative("", booksFile)]);
  await runCommand(git, ["commit", `--message=Read ${asin}`]);
};

const main = async () => {
  if (!argv.asin) {
    throw new Error("ASIN code must be passed.");
  }

  if (!argv.title) {
    throw new Error("Book title must be passed.");
  }

  if (!argv.type) {
    throw new Error("Book type must  be passed.");
  }

  const git = await whichAsync("git");
  return addBook(argv.asin, argv.title, argv.type, git);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
