const execFile = require("../lib/exec-file");
const path = require("path");
const which = require("../lib/which");

const files = [
  {
    dest: "../tmp/favicon-16.png",
    src: "../src/favicon.svg",
    width: 16
  },
  {
    dest: "../tmp/favicon-32.png",
    src: "../src/favicon.svg",
    width: 32
  },
  {
    dest: "../tmp/favicon-48.png",
    src: "../src/favicon.svg",
    width: 48
  },
  {
    dest: "../dist/apple-touch-icon-precomposed.png",
    src: "../src/favicon.svg",
    width: 180
  }
];

const findExec = name => which(name);

const toPNG = async (inkscape, file) => {
  let args = ["-f", file.src, "-e", file.dest];

  if (file.area) {
    args = args.concat("-a", file.area);
  }

  if (file.height) {
    args = args.concat("-h", file.height);
  }

  if (file.width) {
    args = args.concat("-w", file.width);
  }

  await execFile(inkscape, args);
  return file.dest;
};

const isFaviconSource = filepath =>
  path.basename(filepath).startsWith("favicon-");

const toFavicon = (convert, filepaths) =>
  execFile(convert, [...filepaths, "../dist/favicon.ico"]);

const main = async () => {
  const [convert, inkscape] = await Promise.all([
    findExec("convert"),
    findExec("inkscape")
  ]);
  const filepaths = await Promise.all(files.map(toPNG.bind(null, inkscape)));
  await toFavicon(convert, filepaths.filter(isFaviconSource));
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
