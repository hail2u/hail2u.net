import config from "../../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import util from "node:util";

const cp = async (file) => {
  const src = sharp(file).resize({
    height: 1440,
    width: 2560,
    withoutEnlargement: true,
  });
  const basename = path.basename(file, ".jpg");
  const dest = path.join(config.dir.dest, "img/blog/");
  const jpg = path.join(dest, `${basename}.jpg`);
  const avif = path.join(dest, `${basename}.avif`);
  await Promise.all([src.toFile(jpg), src.toFile(avif)]);
};

const main = async () => {
  const {
    positionals: [src],
  } = util.parseArgs({ allowPositionals: true });

  if (!src) {
    throw new Error("1 argument is required. This is for an source directory.");
  }

  const files = await fs.glob(`${src}*.jpg`);
  await Array.fromAsync(files, cp);
};

main().catch((e) => {
  throw e;
});
