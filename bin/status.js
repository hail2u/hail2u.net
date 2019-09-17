const config = require("./index.json");
const { readJSONFile, writeJSONFile } = require("../lib/json-file");
const runCommand = require("../lib/run-command");
const findCommand = require("../lib/find-command");

const main = async () => {
  if (process.argv.length !== 3) {
    throw new Error("Text and only text must be passed.");
  }

  const [statuses, git] = await Promise.all([
    readJSONFile(config.data.statuses, "utf8"),
    findCommand("git")
  ]);
  const text = process.argv.slice(2).shift();
  await writeJSONFile(config.data.statuses, [{
    published: Date.now(),
    text: text
  }, ...statuses]);
  await runCommand(git, ["add", "--", config.data.statuses]);
  await runCommand(git, ["commit", "--message=Update status"]);
};

main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
