import config from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import util from "node:util";

const build = (file) => {
  const ext = path.extname(file);
  const basename = path.basename(file, ext);
  const dest = path.join(config.dir.dest, "/img/blog/", `${basename}.avif`);
  sharp(file)
    .resize({
      height: 1440,
      width: 2560,
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
  throw new Error("1 argument is required. This is for an source directory.");
}

const images = await Array.fromAsync(fs.glob(`${src}*.png`));
await Promise.all(images.map(build));
