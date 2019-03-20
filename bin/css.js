const CleanCSS = require("clean-css");
const fs = require("fs").promises;

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
const minifier = new CleanCSS({
  level: 2,
  returnPromise: true
});

const buildCSS = async file => {
  const minified = await minifier.minify([file.src]);
  await fs.writeFile(file.dest, minified.styles);
};

process.chdir(__dirname);
Promise.all(files.map(buildCSS)).catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
