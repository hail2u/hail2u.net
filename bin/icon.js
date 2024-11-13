import config from "../config.js";
import fs from "node:fs/promises";
import ico from "@fiahfy/ico";
import path from "node:path";
import sharp from "sharp";

process.on("unhandledRejection", (e) => {
  throw e;
});

const generatePNG = async (src, width) => {
  const metadata = await sharp(src).metadata();
  const density = (width * metadata.density) / metadata.width;
  const img = sharp(src, { density });
  img.resize(width);
  return img;
};

const appendTo = async (favicon, img) => {
  const png = await img.png().toBuffer();
  favicon.append(ico.IcoImage.fromPNG(png));
};

const file = path.join(config.dir.dest, "favicon.ico");
const [favicon, , touchIcon, ...icons] = await Promise.all([
  new ico.Ico(),
  fs.mkdir(path.dirname(file), { recursive: true }),
  generatePNG(config.file.icon, 180),
  generatePNG(config.file.icon, 16),
  generatePNG(config.file.icon, 24),
  generatePNG(config.file.icon, 32),
  generatePNG(config.file.icon, 48),
  generatePNG(config.file.icon, 64),
  generatePNG(config.file.icon, 128),
  generatePNG(config.file.icon, 256),
]);
await Promise.all(icons.map(appendTo.bind(null, favicon)));
await Promise.all([
  touchIcon.toFile(path.join(config.dir.dest, "apple-touch-icon.png")),
  fs.writeFile(file, favicon.data),
]);
