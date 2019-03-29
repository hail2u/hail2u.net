const path = require("path");
const { readJSONFile, writeJSONFile } = require("../lib/json");
const runCommand = require("../lib/run-command");
const whichAsync = require("../lib/which-async");

const statusesFile = "../src/statuses/statuses.json";

const main = async () => {
  if (process.argv.length > 3) {
    throw new Error("Only text must be passed.");
  }

  const [statuses, git] = await Promise.all([
    readJSONFile(statusesFile, "utf8"),
    whichAsync("git")
  ]);
  const text = process.argv.slice(2).shift();
  await writeJSONFile(statusesFile, [{
    published: Date.now(),
    text: text
  }, ...statuses]);
  await runCommand(git, ["add", "--", path.relative("", statusesFile)]);
  await runCommand(git, ["commit", "--message=Update status"]);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
