const { execFile } = require("child_process");
const path = require("path");
const waterfall = require("../lib/waterfall");
const which = require("which").sync;

const tmp = "../tmp/";
const src = "../src/img/";
const toFaviconMapping = size => ({
  dest: path.join(tmp, `favicon-${size}.png`),
  src: path.join(src, "favicon.svg"),
  width: size
});
const dest = "../dist/";
const generateFileMappings = () => {
  const touchIconBasename = "apple-touch-icon-precomposed";

  return [16, 32, 48].map(toFaviconMapping).concat([
    {
      dest: path.join(dest, `${touchIconBasename}.png`),
      src: path.join(src, `${touchIconBasename}.svg`),
      width: 180
    }
  ]);
};
const inkscape = which("inkscape");
const toPNG = file =>
  new Promise((resolve, reject) => {
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

    execFile(inkscape, args, e => {
      if (e) {
        return reject(e);
      }

      resolve(file.dest);
    });
  });
const toPNGAll = files => Promise.all(files.map(toPNG));
const isFaviconSource = file => path.basename(file).startsWith("favicon-");
const convert = which("convert");
const toFavicon = args =>
  new Promise((resolve, reject) => {
    args = args.filter(isFaviconSource);
    args.push(`${dest}favicon.ico`);
    execFile(convert, args, e => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });

process.chdir(__dirname);
waterfall([generateFileMappings, toPNGAll, toFavicon]).catch(e => {
  console.trace(e);
});
