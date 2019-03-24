const minimist = require("minimist");
const path = require("path");
const { readJSONFile, writeJSONFile } = require("../lib/json");
const runCommand = require("../lib/run-command");
const whichAsync = require("../lib/which-async");

const argv = minimist(process.argv.slice(2), {
  alias: {
    a: "asin",
    t: "title",
    y: "type",
    u: "url"
  },
  default: {
    asin: "",
    title: "",
    type: "",
    url: ""
  },
  string: ["asin", "title", "type", "url"]
});
const nonfictionsFile = "../src/links/nonfictions.json";
const comicsFile = "../src/links/comics.json";
const novelsFile = "../src/links/novels.json";
const webpagesFile = "../src/links/webpages.json";

const selectBooksFile = type => {
  if (type === "comic") {
    return comicsFile;
  }

  if (type === "novel") {
    return novelsFile;
  }

  return nonfictionsFile;
};

const addBook = async (asin, title, type, git) => {
  if (/^[A-Z0-9]{10}$/i.test(asin)) {
    throw new Error("ASIN must be 10 alphanumeric characters.");
  }

  const booksFile = selectBooksFile(type);
  const books = await readJSONFile(booksFile);
  await writeJSONFile(booksFile, [{
    published: Date.now(),
    asin: asin,
    title: title
  }, ...books]);
  await runCommand(git, ["add", "--", path.relative("", booksFile)]);
  await runCommand(git, ["commit", `--message=Read ${asin}`]);
};

const addWebpage = async (title, url, git) => {
  const webpages = await readJSONFile(webpagesFile);
  await writeJSONFile(webpagesFile, [{
    published: Date.now(),
    title: title,
    url: url
  }, ...webpages]);
  await runCommand(git, ["add", "--", path.relative("", webpagesFile)]);
  await runCommand(git, ["commit", `--message=Bookmark ${url}`]);
};

const main = async () => {
  const git = await whichAsync("git");

  if (argv.asin && argv.title && argv.type) {
    return addBook(argv.asin, argv.title, argv.type, git);
  }

  if (argv.title && argv.url) {
    return addWebpage(argv.title, argv.url, git);
  }

  throw new Error(`Arguments must be one of these combinations:
  --asin --title --type => Add book
  --title --url         => Add webpage
`);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
