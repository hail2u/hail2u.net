const execFileAsync = require("../lib/exec-file-async");
const whichAsync = require("../lib/which-async");

const main = async () => {
  const git = await whichAsync("git");
  const { stdout } = await execFileAsync(git, ["branch", "--show-current"]);

  if (stdout.trim().toLowerCase() !== "master") {
    throw new Error("You are not in “master” branch.");
  }
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
