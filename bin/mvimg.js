import config from "../config.js";
import { glob } from "glob";
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

  const files = await glob(`${src}*.jpg`);

  if (files.length < 1) {
    throw new Error(`There is no JPEG files in the source directory: ${src}`);
  }

  await Promise.all(files.map(cp));
};

main().catch((e) => {
  /* eslint-disable-next-line no-console */
  console.trace(e);
  process.exitCode = 1;
});
