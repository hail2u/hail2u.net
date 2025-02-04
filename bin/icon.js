import config from "../config.js";
import fs from "node:fs/promises";
import ico from "@fiahfy/ico";
import path from "node:path";
import sharp from "sharp";

const appendTo = async (icon, size) => {
  const metadata = await sharp(config.file.icon).metadata();
  const density = (size * metadata.density) / metadata.width;
  const img = sharp(config.file.icon, { density });
  const png = await img.resize(size).png().toBuffer();
  icon.append(ico.IcoImage.fromPNG(png));
};

const generateIcon = async () => {
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const icon = new ico.Ico();
  await Promise.all(sizes.map(appendTo.bind(null, icon)));
  return icon;
};

const file = path.join(config.dir.dest, "favicon.ico");
const [, icon] = await Promise.all([
  fs.mkdir(path.dirname(file), { recursive: true }),
  generateIcon(),
]);
await fs.writeFile(file, icon.data);
