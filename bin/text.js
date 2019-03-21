const { execFile } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { promisify } = require("util");
const which = require("which");

const execFileAsync = promisify(execFile);
const textsFile = "../src/statuses/texts.json";
const whichAsync = promisify(which);

const readJSONFile = async file => {
  const json = await fs.readFile(file, "utf8");
  return JSON.parse(json);
};

const runCommand = async (command, args) => {
  const { stdout } = await execFileAsync(command, args);
  return process.stdout.write(stdout);
};

const main = async () => {
  const [texts, git] = await Promise.all([
    readJSONFile(textsFile, "utf8"),
    whichAsync("git")
  ]);
  const text = process.argv.slice(2).shift();
  await fs.writeFile(textsFile, `${JSON.stringify([...texts, {
    published: Date.now(),
    text: text
  }], null, 2)}
`);
  await runCommand(git, ["add", "--", path.relative("", textsFile)]);
  await runCommand(git, ["commit", `--message=Update status`]);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
