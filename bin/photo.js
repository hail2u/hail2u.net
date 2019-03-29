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
}

const isValidWidth = async filename => {
  const metadata = await sharp(filename).metadata();

  if (metadata.width < 1600) {
    return true;
  }

  return false;
};

const pad = number => String(number).padStart(2, "0");

const generateFilename = dt => `${pad(dt.getFullYear())}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}.jpg`;

const copy = (src, dest) => fs.copyFile(src, dest);

const main = async () => {
  if (process.argv.length > 3) {
    throw new Error("Only filename must be passed.");
  }

  const photo = process.argv.slice(2).shift();

  if (!isPhoto(photo)) {
    throw new Error("JPEG file must be passed.");
  }

  if (!isValidWidth(photo)) {
    throw new Error("JPEG file must be 1600px width or lower");
  }

  const [filename, git] = await Promise.all([
    generateFilename(new Date()),
    whichAsync("git")
  ]);
  const src = path.join(srcDir, filename);
  await Promise.all([
    path.join(distDir, filename),
    src
  ].map(copy.bind(null, photo)));
  await Promise.all([
    runCommand(git, ["add", "--", path.relative("", src)]),
    fs.unlink(photo)
  ]);
  await runCommand(git, ["commit", `--message=Add ${filename}`]);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
