const config = require("./index.json");
const minimist = require("minimist");
const { readJSONFile, writeJSONFile } = require("../lib/json-file");
const runCommand = require("../lib/run-command");
const findCommand = require("../lib/find-command");

const selectBooksFile = type => {
  const key = `${type}s`;

  if (config.data[key]) {
    return config.data[key];
  }

  throw new Error("Book type must be one of “comic”, “novel”, and “nonfiction.”");
};

const main = async () => {
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
    findCommand("git")
  ]);

  if (books.find(book => argv.asin === book.asin)) {
    throw new Error(`${argv.title} has already been added.`);
  }

  await writeJSONFile(booksFile, [{
    asin: argv.asin,
    published: Date.now(),
    title: argv.title
  }, ...books]);
  await runCommand(git, ["add", "--", booksFile]);
  await runCommand(git, ["commit", `--message=Read ${argv.asin}`]);
};

main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
