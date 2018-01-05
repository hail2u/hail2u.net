const execFile = require("../lib/exec-file");
const path = require("path");
const which = require("../lib/which");

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

const generatePNG = async (inkscape, file) => {
  await execFile(inkscape, ["-f", file.src, "-e", file.dest, "-w", file.width]);
  return file.dest;
};

const isFaviconSource = filepath =>
  path.basename(filepath).startsWith("favicon-");

const generateFavicon = (convert, filepaths) =>
  execFile(convert, [...filepaths, "../dist/favicon.ico"]);

const main = async () => {
  const [convert, inkscape] = await Promise.all([
    which("convert"),
    which("inkscape")
  ]);
  const filepaths = await Promise.all(
    files.map(generatePNG.bind(null, inkscape))
  );
  await generateFavicon(convert, filepaths.filter(isFaviconSource));
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
