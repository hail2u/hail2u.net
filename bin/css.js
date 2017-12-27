const atImport = require("postcss-import");
const csswring = require("csswring");
const fs = require("fs-extra");
const mqpacker = require("css-mqpacker");
const path = require("path");
const postcss = require("postcss");
const waterfall = require("../lib/waterfall");

const cssExt = ".css";
const dest = "../tmp/";
const minExt = ".min";
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
const wrapWithSupports = postcss.plugin("wrap-with-supports", () => css => {
  const supports = postcss.parse("@supports(top:0){}");

  css.each(n => {
    supports.first.append(n);
  });
  css.append(supports);
});
const processor = postcss([
  atImport(),
  mqpacker(),
  csswring(),
  wrapWithSupports()
]);
const optimizeCSS = async file => ({
  ...file,
  ...{
    contents: await processor.process(file.contents, {
      from: file.src,
      to: file.dest
    })
  }
});
const writeCSS = async file => fs.outputFile(file.dest, file.contents);
const buildCSS = file => waterfall([readCSS, optimizeCSS, writeCSS], file);
const buildAll = files => Promise.all(files.map(buildCSS));

process.chdir(__dirname);
waterfall([listFiles, buildAll]).catch(e => {
  console.trace(e);
});
