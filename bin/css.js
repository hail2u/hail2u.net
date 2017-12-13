const atImport = require("postcss-import");
const csswring = require("csswring");
const fs = require("fs-extra");
const mqpacker = require("css-mqpacker");
const path = require("path");
const postcss = require("postcss");
const waterfall = require("../lib/waterfall");
const wrapWithSupports = require("../lib/wrap-with-supports");

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

  files.push({
    dest: path.join(dest, `${path.basename(file, cssExt)}${minExt}${cssExt}`),
    src: path.join(src, file)
  });

  return files;
};
const listFiles = () =>
  new Promise((resolve, reject) => {
    fs.readdir(src, (e, f) => {
      if (e) {
        return reject(e);
      }

      resolve(f.reduce(generateFileMappings, []));
    });
  });
const readCSS = file =>
  new Promise((resolve, reject) => {
    fs.readFile(file.src, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      file.contents = d;
      resolve(file);
    });
  });
const processor = postcss([
  atImport(),
  mqpacker(),
  csswring(),
  wrapWithSupports()
]);
const optimizeCSS = file =>
  processor
    .process(file.contents, {
      from: file.src,
      to: file.dest
    })
    .then(r => {
      file.contents = r.css;

      return file;
    });
const writeCSS = file =>
  new Promise((resolve, reject) => {
    fs.outputFile(file.dest, file.contents, e => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
const buildCSS = file => waterfall([readCSS, optimizeCSS, writeCSS], file);
const buildAll = files => Promise.all(files.map(buildCSS));

process.chdir(__dirname);
waterfall([listFiles, buildAll]).catch(e => {
  console.trace(e);
});
