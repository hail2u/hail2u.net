const atImport = require("postcss-import");
const csswring = require("csswring");
const fs = require("fs-extra");
const mqpacker = require("css-mqpacker");
const path = require("path");
const postcss = require("postcss");
const wrapWithSupports = require("../lib/wrap-with-supports");

const cssExt = ".css";
const destDir = "../tmp/";
const minExt = ".min";
const processor = postcss([
  atImport(),
  mqpacker(),
  csswring(),
  wrapWithSupports()
]);
const srcDir = "../src/css/";

const isTarget = filename => {
  if (path.extname(filename) !== cssExt) {
    return false;
  }

  if (filename.startsWith("_")) {
    return false;
  }

  return true;
};

const listFilenames = async () => {
  const filenames = await fs.readdir(srcDir);
  return filenames.filter(isTarget);
};

const readCSS = filepath => fs.readFile(filepath, "utf8");

const buildCSS = async filename => {
  const src = path.join(srcDir, filename);
  const dest = path.join(
    destDir,
    `${path.basename(filename, cssExt)}${minExt}${cssExt}`
  );
  const css = await readCSS(src);
  const processed = await processor.process(css, {
    from: src,
    to: dest
  });
  await fs.outputFile(dest, processed.css);
};

const main = async () => {
  const filenames = await listFilenames();
  return Promise.all(filenames.map(buildCSS));
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
