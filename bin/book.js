const config = require("./index.json");
const findCommand = require("../lib/find-command");
const minimist = require("minimist");
const { readJSONFile, writeJSONFile } = require("../lib/json-file");
const runCommand = require("../lib/run-command");

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

  if (!["comic", "novel", "nonfiction"].includes(argv.type)) {
    throw new Error("Book type must be one of “comic”, “novel”, and “nonfiction.”");
  }

  const [books, git] = await Promise.all([
    readJSONFile(config.data.books),
    findCommand("git")
  ]);

  if (books.find(book => argv.asin === book.asin)) {
    throw new Error(`${argv.title} has already been added.`);
  }

  await writeJSONFile(config.data.books, [{
    asin: argv.asin,
    published: Date.now(),
    title: argv.title,
    type: argv.type
  }, ...books]);
  await runCommand(git, ["add", "--", config.data.books]);
  await runCommand(git, ["commit", `--message=Read ${argv.asin}`]);
};

main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
