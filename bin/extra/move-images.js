import config from "../../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import util from "node:util";

const convert = async (basename, image, ext) => {
  const dest = path.join(config.dir.static, "img/blog/", `${basename}.${ext}`);
  await image.toFile(dest);
  fs.copyFile(dest, dest.replace(config.dir.static, config.dir.dest));
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

const main = async () => {
  const {
    positionals: [src],
  } = util.parseArgs({ allowPositionals: true });

  if (!src) {
    throw new Error("1 argument is required. This is for an source directory.");
  }

  const filesIterator = await fs.glob(`${src}*.png`);
  const images = await Array.fromAsync(filesIterator);
  await Promise.all(images.map(build));
};

main().catch((e) => {
  throw e;
});
