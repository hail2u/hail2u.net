import config from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import util from "node:util";

const toAVIF = (file) => {
  const { height, width } = config.image.blog;
  const ext = path.extname(file);
  const basename = path.basename(file, ext);
  const dest = path.join(config.dir.image, "blog", `${basename}.avif`);
  sharp(file)
    .resize({
      height,
      width,
      withoutEnlargement: true,
    })
    .toFile(dest);
};

const {
  positionals: [src],
} = util.parseArgs({
  allowPositionals: true,
});

if (!src) {
  throw new Error("A source directory is required.");
}

const images = await Array.fromAsync(fs.glob(`${src}*.png`));
await Promise.all(images.map(toAVIF));
