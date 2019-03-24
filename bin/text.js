const path = require("path");
const { readJSONFile, writeJSONFile } = require("../lib/json");
const runCommand = require("../lib/run-command");
const whichAsync = require("../lib/which-async");

const textsFile = "../src/statuses/texts.json";

const main = async () => {
  if (process.argv.length > 3) {
    throw new Error("Only text must be passed.");
  }

  const [texts, git] = await Promise.all([
    readJSONFile(textsFile, "utf8"),
    whichAsync("git")
  ]);
  const text = process.argv.slice(2).shift();
  await writeJSONFile(textsFile, [{
    published: Date.now(),
    text: text
  }, ...texts]);
  await runCommand(git, ["add", "--", path.relative("", textsFile)]);
  await runCommand(git, ["commit", `--message=Update status`]);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
