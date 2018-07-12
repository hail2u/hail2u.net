const { execFile } = require("child_process");
const path = require("path");
const { promisify } = require("util");
const sharp = require("sharp");
const which = require("which");

const execFileAsync = promisify(execFile);
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
const whichAsync = promisify(which);

const generatePNG = async (file) => {
  await sharp(file.src).resize(file.width).toFile(file.dest);
  return file.dest;
};

const generatePNGs = () => Promise.all(files.map(generatePNG));

const isFaviconSource = filepath =>
  path.basename(filepath).startsWith("favicon-");

const generateFavicon = (convert, filepaths) =>
  execFileAsync(convert, [...filepaths, "../dist/favicon.ico"]);

const main = async () => {
  const [convert, filepaths] = await Promise.all([
    whichAsync("convert"),
    generatePNGs()
  ]);
  await generateFavicon(convert, filepaths.filter(isFaviconSource));
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
