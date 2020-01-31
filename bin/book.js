import config from "./index.js";
import minimist from "minimist";
import { readJSONFile, writeJSONFile } from "../lib/json-file.js";
import runCommand from "../lib/run-command.js";
import which from "which";

const main = async () => {
  const argv = minimist(process.argv.slice(2), {
    alias: {
      a: "asin",
      t: "title"
    },
    default: {
      asin: "",
      title: ""
    },
    string: ["asin", "title"]
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

  const [books, git] = await Promise.all([
    readJSONFile(config.data.books),
    which("git")
  ]);

  if (books.find(book => argv.asin === book.asin)) {
    throw new Error(`${argv.title} has already been added.`);
  }

  await writeJSONFile(config.data.books, [{
    asin: argv.asin,
    published: Date.now(),
    title: argv.title
  }, ...books]);
  await runCommand(git, ["add", "--", config.data.books]);
  await runCommand(git, ["commit", `--message=Read ${argv.asin}`]);
};

main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
