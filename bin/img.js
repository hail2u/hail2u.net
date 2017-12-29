const execFile = require("../lib/exec-file");
const path = require("path");
const which = require("../lib/which");

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
const findExec = name => which(name);
const toPNG = async (inkscape, file) => {
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

  await execFile(inkscape, args);

  return file.dest;
};
const isFaviconSource = file => path.basename(file).startsWith("favicon-");
const toFavicon = (files, convert) =>
  execFile(convert, [...files, `${dest}favicon.ico`]);
const main = async () => {
  let files = await generateFileMappings();

  files = await Promise.all(
    files.map(toPNG.bind(null, await findExec("inkscape")))
  );
  files = files.filter(isFaviconSource);
  toFavicon(files, await findExec("convert"));
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
