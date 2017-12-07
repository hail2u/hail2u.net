const {execFile} = require("child_process");
const path = require("path");
const which = require("which").sync;

const files = [
  {
    dest: "../dist/apple-touch-icon-precomposed.png",
    src: "../src/img/touch-icon.svg",
    width: 180
  },
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
  }
];

const inkscape = which("inkscape");
const toPNG = (file) => new Promise((resolve, reject) => {
  const args = ["-f", file.src, "-e", file.dest];

  if (file.area) {
    args.push("-a", file.area);
  }

  if (file.height) {
    args.push("-h", file.height);
  }

  if (file.width) {
    args.push("-w", file.width);
  }

  execFile(inkscape, args, (e) => {
    if (e) {
      return reject(e);
    }

    resolve(file.dest);
  });
});
const isFaviconSource = (file) => path.basename(file)
  .startsWith("favicon-");
const convert = which("convert");
const toFavicon = (args) => new Promise((resolve, reject) => {
  args = args.filter(isFaviconSource);
  args.push("../dist/favicon.ico");
  execFile(convert, args, (e) => {
    if (e) {
      return reject(e);
    }

    resolve();
  });
});

process.chdir(__dirname);
Promise.all(files.map(toPNG))
  .then(toFavicon)
  .catch((e) => {
    console.trace(e);
  });
