import CleanCSS from "clean-css";
import config from "./index.js";
import { promises as fs } from "fs";
import getVersion from "../lib/get-version.js";

const minifier = new CleanCSS({
  format: "beautify",
  level: 2,
  returnPromise: true
});

const buildCSS = async file => {
  const [version, minified] = await Promise.all([
    getVersion(),
    minifier.minify([file.src])
  ]);
  const dest = file.dest.replace(/{{version}}/g, version);
  await fs.writeFile(dest, minified.styles);
};

Promise.all(config.files.css.map(buildCSS)).catch(e => {
  console.trace(e);
  process.exitCode = 1;
});
