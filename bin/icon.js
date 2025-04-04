import config from "../config.js";
import fs from "node:fs/promises";
import ico from "@fiahfy/ico";
import path from "node:path";
import sharp from "sharp";

const toIcon = async (icon, size) => {
  const density = (size * 72) / 16;
  const png = await sharp(config.file.icon, {
    density,
  })
    .resize(size)
    .flatten({
      background: "#fff",
    })
    .png()
    .toBuffer();
  icon.append(ico.IcoImage.fromPNG(png));
};

const sizes = [16, 24, 32, 48, 64, 128, 256];
const icon = new ico.Ico();
await Promise.all(sizes.map(toIcon.bind(null, icon)));
const file = path.join(config.dir.dest, "favicon.ico");
await fs.mkdir(path.dirname(file), {
  recursive: true,
});
await fs.writeFile(file, icon.data);
