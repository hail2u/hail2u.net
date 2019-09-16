const CleanCSS = require("clean-css");
const config = require("./index.json");
const fs = require("fs").promises;
const { version } = require("../package.json");

const minifier = new CleanCSS({
  level: 2,
  returnPromise: true
});

const versioning = filename => filename.replace(/{{version}}/g, version);

const buildCSS = async file => {
  const minified = await minifier.minify([file.src]);
  await fs.writeFile(versioning(file.dest), minified.styles);
};

Promise.all(config.files.css.map(buildCSS)).catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
