const { execFile } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { promisify } = require("util");
const which = require("which");

const distDir = "../dist/img/photos/";
const execFileAsync = promisify(execFile);
const srcDir = "../src/img/photos/";
const whichAsync = promisify(which);

const isSnapshot = filename => {
  if (path.extname(filename).toLowerCase() === ".jpg") {
    return true;
  }

  return false;
}

const pad = number => String(number).padStart(2, "0");

const generateFilename = dt => `${pad(dt.getFullYear())}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}.jpg`;

const copy = (src, dest) => fs.copyFile(src, dest);

const runCommand = async (command, args) => {
  const { stdout } = await execFileAsync(command, args);
  return process.stdout.write(stdout);
};

const main = async () => {
  const snapshot = process.argv.slice(2).shift();

  if (!isSnapshot(snapshot)) {
    throw new Error("JPEG file must be passed.");
  }

  const [filename, git] = await Promise.all([
    generateFilename(new Date()),
    whichAsync("git")
  ]);
  const src = path.join(srcDir, filename);
  await Promise.all([
    path.join(distDir, filename),
    src
  ].map(copy.bind(null, snapshot)));
  await runCommand(git, ["add", "--", path.relative("", src)]);
  await runCommand(git, ["commit", `--message=Add ${filename}`]);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
