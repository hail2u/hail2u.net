import config from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import util from "node:util";

const convert = async (basename, image, ext) => {
  const dest = path.join(config.dir.dest, "img/blog/", `${basename}.${ext}`);
  await image.toFile(dest);
};

const build = (file) => {
  const formats = ["avif", "jpg"];
  const ext = path.extname(file);
  const basename = path.basename(file, ext);
  const image = sharp(file).resize({
    height: 1440,
    width: 2560,
    withoutEnlargement: true,
  });
  Promise.all(formats.map(convert.bind(null, basename, image)));
};

const {
  positionals: [src],
} = util.parseArgs({ allowPositionals: true });

if (!src) {
  throw new Error("1 argument is required. This is for an source directory.");
}

const filesIterator = fs.glob(`${src}*.png`);
const images = await Array.fromAsync(filesIterator);
await Promise.all(images.map(build));
