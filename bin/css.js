const atImport = require("postcss-import");
const csswring = require("csswring");
const fs = require("fs").promises;
const mqpacker = require("css-mqpacker");
const postcss = require("postcss");
const toLonghand = require("../lib/to-longhand");
const wrapWithSupports = require("../lib/wrap-with-supports");

const files = [
  {
    dest: "../tmp/debug.min.css",
    src: "../src/css/debug.css"
  },
  {
    dest: "../tmp/documents.min.css",
    src: "../src/css/documents.css"
  },
  {
    dest: "../tmp/main.min.css",
    src: "../src/css/main.css"
  }
];
const processor = postcss([
  atImport(),
  mqpacker(),
  csswring(),
  toLonghand(),
  wrapWithSupports()
]);

const buildCSS = async file => {
  const css = await fs.readFile(file.src, "utf8");
  const processed = await processor.process(css, {
    from: file.src,
    to: file.dest
  });
  await fs.writeFile(file.dest, processed.css);
};

process.chdir(__dirname);
Promise.all(files.map(buildCSS)).catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
