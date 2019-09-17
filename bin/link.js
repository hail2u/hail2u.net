const config = require("./index.json");
const minimist = require("minimist");
const { readJSONFile, writeJSONFile } = require("../lib/json-file");
const runCommand = require("../lib/run-command");
const findCommand = require("../lib/find-command");

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
    readJSONFile(config.data.links),
    findCommand("git")
  ]);
  await writeJSONFile(config.data.links, [{
    published: Date.now(),
    title: argv.title,
    url: argv.url
  }, ...links]);
  await runCommand(git, ["add", "--", config.data.links]);
  await runCommand(git, ["commit", `--message=Bookmark ${argv.url}`]);
};

main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
