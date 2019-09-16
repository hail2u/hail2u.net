const config = require("./index.json");
const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");
const toIco = require("to-ico");

const generatePNG = async file => {
  await sharp(file.src)
    .resize(file.width)
    .toFile(file.dest);
  return file.dest;
};

const isFaviconSource = filepath => path.basename(filepath).startsWith("favicon-");

const readPNG = png => fs.readFile(png, {
  encoding: null
});

const main = async () => {
  const pngs = await Promise.all(config.files.icon.map(generatePNG));
  const srcs = await Promise.all(pngs.filter(isFaviconSource).map(readPNG));
  const favicon = await toIco(srcs);
  await fs.writeFile(config.dest.favicon, favicon);
};

main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
