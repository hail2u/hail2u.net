const minimist = require("minimist");
const path = require("path");
const { readJSONFile, writeJSONFile } = require("../lib/json");
const runCommand = require("../lib/run-command");
const whichAsync = require("../lib/which-async");

const linksFile = "../src/links/links.json";

const main = async () => {
  const argv = minimist(process.argv.slice(2), {
    alias: {
      t: "title",
      u: "url"
    },
    default: {
      title: "",
      url: ""
    },
    string: ["title", "url"]
  });

  if (!argv.title) {
    throw new Error("Title must be passed.");
  }

  if (!argv.url) {
    throw new Error("URL must be passed.");
  }

  const [links, git] = await Promise.all([
    readJSONFile(linksFile),
    whichAsync("git")
  ]);
  await writeJSONFile(linksFile, [{
    published: Date.now(),
    title: argv.title,
    url: argv.url
  }, ...links]);
  await runCommand(git, ["add", "--", path.relative("", linksFile)]);
  await runCommand(git, ["commit", `--message=Bookmark ${argv.url}`]);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
