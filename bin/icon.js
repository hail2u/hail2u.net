const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");
const toIco = require("to-ico");

const files = [
  {
    dest: "../tmp/favicon-16.png",
    src: "../src/img/favicon.svg",
    width: 16
  },
  {
    dest: "../tmp/favicon-32.png",
    src: "../src/img/favicon.svg",
    width: 32
  },
  {
    dest: "../tmp/favicon-48.png",
    src: "../src/img/favicon.svg",
    width: 48
  },
  {
    dest: "../dist/apple-touch-icon-precomposed.png",
    src: "../src/img/apple-touch-icon-precomposed.svg",
    width: 180
  }
];

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
  const pngs = await Promise.all(files.map(generatePNG));
  const srcs = await Promise.all(pngs.filter(isFaviconSource).map(readPNG));
  const favicon = await toIco(srcs);
  await fs.writeFile("../dist/favicon.ico", favicon);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
