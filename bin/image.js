import config from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import util from "node:util";

const toAVIF = async (file) => {
  const { dir, height, width } = config.image.blog;
  const ext = path.extname(file);
  const basename = path.basename(file, ext);
  const dest = path.join(config.dir.static, dir, `${basename}.avif`);
  await sharp(file)
    .resize({
      height,
      width,
      withoutEnlargement: true,
    })
    .toFile(dest);
  await fs.cp(dest, dest.replace(config.dir.static, config.dir.dest));
};

const {
  positionals: [src],
} = util.parseArgs({
  allowPositionals: true,
});

if (!src) {
  throw new Error("A source directory is required.");
}

const globber = fs.glob(`${src}*.png`);
await Array.fromAsync(globber, toAVIF);
