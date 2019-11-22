import config from "./index.js";
import { promises as fs } from "fs";
import path from "path";
import runCommand from "../lib/run-command.js";
import sharp from "sharp";
import which from "which";

const isPhoto = filename => {
  if ([".jpeg", ".jpg"].includes(path.extname(filename).toLowerCase())) {
    return true;
  }

  return false;
};

const generateFilename = dt => {
  const year = String(dt.getFullYear()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const date = String(dt.getDate()).padStart(2, "0");
  const hours = String(dt.getHours()).padStart(2, "0");
  const minutes = String(dt.getMinutes()).padStart(2, "0");
  const seconds = String(dt.getSeconds()).padStart(2, "0");
  return `${year}${month}${date}${hours}${minutes}${seconds}.jpg`;
};

const main = async () => {
  if (process.argv.length !== 3) {
    throw new Error("Photo filename must be passed. And there should not be any other options.");
  }

  const photo = process.argv.slice(2).shift();

  if (!isPhoto(photo)) {
    throw new Error("Photo file must be JPEG.");
  }

  const [filename, git] = await Promise.all([
    generateFilename(new Date()),
    which("git")
  ]);
  const src = path.join(config.src.photos, filename);
  await sharp(photo)
    .resize({
      width: 1280
    })
    .toFile(src);
  const dest = path.join(config.dest.photos, filename);
  await Promise.all([
    fs.copyFile(src, dest),
    fs.unlink(photo),
    runCommand(git, ["add", "--", src])
  ]);
  await runCommand(git, ["commit", `--message=Add ${filename}`]);
};

main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
