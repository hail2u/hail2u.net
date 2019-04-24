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
const booksFile = {
  comic: "../src/links/comics.json",
  nonfiction: "../src/links/nonfictions.json",
  novel: "../src/links/novels.json"
};

const main = async () => {
  if (!argv.asin) {
    throw new Error(`ASIN must be passed.
`);
  }

  if (!/^[A-Z0-9]{10}$/i.test(argv.asin)) {
    throw new Error("ASIN must be 10 alphanumeric characters.");
  }

  if (!argv.title) {
    throw new Error(`Title must be passed.
`);
  }

  if (!argv.type) {
    throw new Error(`Type must be passed.
`);
  }

  if (!booksFile[argv.type]) {
    throw new Error(`Type must be one of these string: comic, nonfiction, or novel
`);
  }

  const [git, books] = await Promise.all([
    whichAsync("git"),
    readJSONFile(booksFile[argv.type])
  ]);
  await writeJSONFile(booksFile[argv.type], [{
    asin: argv.asin,
    published: Date.now(),
    title: argv.title
  }, ...books]);
  await runCommand(git, ["add", "--", path.relative("", booksFile[argv.type])]);
  await runCommand(git, ["commit", `--message=Read ${argv.asin}`]);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
