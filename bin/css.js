const CleanCSS = require("clean-css");
const fs = require("fs").promises;
const { version } = require("../package.json");

const files = [
  {
    dest: "../tmp/test.min.css",
    src: "../src/css/test.css"
  },
  {
    dest: "../tmp/documents.min.css",
    src: "../src/css/documents.css"
  },
  {
    dest: "../tmp/main.{{version}}.min.css",
    src: "../src/css/main.css"
  }
];
const minifier = new CleanCSS({
  level: 2,
  returnPromise: true
});

const versioning = filename => filename.replace(/{{version}}/g, version);

const buildCSS = async file => {
  const minified = await minifier.minify([file.src]);
  await fs.writeFile(versioning(file.dest), minified.styles);
};

process.chdir(__dirname);
Promise.all(files.map(buildCSS)).catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
