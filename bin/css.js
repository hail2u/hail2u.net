const atImport = require("postcss-import");
const csswring = require("csswring");
const fs = require("fs-extra");
const mqpacker = require("css-mqpacker");
const path = require("path");
const postcss = require("postcss");
const wrapWithSupports = require("../lib/wrap-with-supports");

const cssExt = ".css";
const dest = "../tmp/";
const minExt = ".min";
const processor = postcss([
  atImport(),
  mqpacker(),
  csswring(),
  wrapWithSupports()
]);
const src = "../src/css/";

const generateFileMappings = (files, file) => {
  if (path.extname(file) !== cssExt) {
    return files;
  }

  if (file.startsWith("_")) {
    return files;
  }

  return files.concat([
    {
      dest: path.join(dest, `${path.basename(file, cssExt)}${minExt}${cssExt}`),
      src: path.join(src, file)
    }
  ]);
};

const listFiles = async () => {
  const files = await fs.readdir(src);

  return files.reduce(generateFileMappings, []);
};

const readCSS = async file => ({
  ...file,
  ...{
    contents: await fs.readFile(file.src, "utf8")
  }
});

const optimizeCSS = async file => ({
  ...file,
  ...{
    contents: await processor.process(file.contents, {
      from: file.src,
      to: file.dest
    })
  }
});

const writeCSS = file => fs.outputFile(file.dest, file.contents);

const buildCSS = async file => {
  file = await readCSS(file);
  file = await optimizeCSS(file);
  writeCSS(file);
};

const main = async () => {
  const files = await listFiles();

  Promise.all(files.map(buildCSS));
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
