const fs = require("fs").promises;
const path = require("path");
const runCommand = require("../lib/run-command");
const sharp = require("sharp");
const whichAsync = require("../lib/which-async");

const distDir = "../dist/img/photos/";
const srcDir = "../src/img/photos/";

const isPhoto = filename => {
  if (path.extname(filename).toLowerCase() === ".jpg") {
    return true;
  }

  return false;
};

const pad = number => String(number).padStart(2, "0");

const generateFilename = dt => `${pad(dt.getFullYear())}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}.jpg`;

const main = async () => {
  if (process.argv.length !== 3) {
    throw new Error("Filename and only filename must be passed.");
  }

  const photo = process.argv.slice(2).shift();

  if (!isPhoto(photo)) {
    throw new Error("JPEG file must be passed.");
  }

  const [filename, git] = await Promise.all([
    generateFilename(new Date()),
    whichAsync("git")
  ]);
  const src = path.join(srcDir, filename);
  await sharp(photo)
    .resize({
      width: 1280
    })
    .toFile(src);
  const dest = path.join(distDir, filename);
  await Promise.all([
    fs.copyFile(src, dest),
    fs.unlink(photo),
    runCommand(git, ["add", "--", path.relative("", src)])
  ]);
  await runCommand(git, ["commit", `--message=Add ${filename}`]);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
