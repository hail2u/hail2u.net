import config from "../config.js";
import ico from "@fiahfy/ico";
import { outputFile } from "./lib/output-file.js";
import path from "node:path";
import sharp from "sharp";

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

const main = async () => {
  const [favicon, touchIcon, ...icons] = await Promise.all([
    new ico.Ico(),
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
    outputFile(path.join(config.dir.dest, "favicon.ico"), favicon.data),
  ]);
};

main().catch((e) => {
  throw e;
});
