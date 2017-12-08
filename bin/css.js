const atImport = require("postcss-import");
const csswring = require("csswring");
const fs = require("fs-extra");
const mqpacker = require("css-mqpacker");
const postcss = require("postcss");
const waterfall = require("../lib/waterfall");
const wrapWithSupports = require("../lib/wrap-with-supports");

const files = [
  {
    dest: "../tmp/main.min.css",
    src: "../src/css/main.css"
  },
  {
    dest: "../tmp/debug.min.css",
    src: "../src/css/debug.css"
  }
];

const readCSS = (file) => new Promise((resolve, reject) => {
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
const optimizeCSS = (file) => processor.process(file.contents, {
  from: file.src,
  to: file.dest
})
  .then((r) => {
    file.contents = r.css;

    return file;
  });
const writeCSS = (file) => new Promise((resolve, reject) => {
  fs.outputFile(file.dest, file.contents, (e) => {
    if (e) {
      return reject(e);
    }

    resolve();
  });
});
const buildCSS = (file) => waterfall([
  readCSS,
  optimizeCSS,
  writeCSS
], file);

process.chdir(__dirname);
Promise.all(files.map(buildCSS))
  .catch((e) => {
    console.trace(e);
  });
