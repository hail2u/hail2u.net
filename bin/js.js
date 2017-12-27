const fs = require("fs-extra");
const { compile } = require("google-closure-compiler-js");
const path = require("path");
const waterfall = require("../lib/waterfall");

const tmp = "../tmp/";
const jsExt = ".js";
const minExt = ".min";
const isSameDest = (dest, file) => file.dest === dest;
const src = "../src/js/";
const generateFileMappings = (files, srcFile) => {
  if (path.extname(srcFile) !== jsExt) {
    return files;
  }

  const destFile = path.join(
    tmp,
    `${path
      .extname(path.basename(srcFile, jsExt))
      .replace(/^./, "")}${minExt}${jsExt}`
  );
  const file = files.find(isSameDest.bind(null, destFile));

  srcFile = path.join(src, srcFile);

  if (file) {
    file.src.push(srcFile);
  } else {
    files.push({
      dest: destFile,
      src: [srcFile]
    });
  }

  return files;
};
const listFiles = async () => {
  const files = await fs.readdir(src);

  return files.reduce(generateFileMappings, []);
};
const readJS = async (srcFile, index, srcFiles) => {
  srcFiles[index] = {
    src: await fs.readFile(srcFile, "utf8")
  };
};
const gatherJS = file => Promise.all(file.src.map(readJS)).then(() => file);
const config = {
  compilationLevel: "ADVANCED",
  outputWrapper: "(function () {%output%}).call(window);"
};
const writeJS = async file =>
  fs.outputFile(
    file.dest,
    compile({
      ...config,
      ...{
        jsCode: file.src
      }
    }).compiledCode
  );
const buildJS = file => waterfall([gatherJS, writeJS], file);
const buildAll = files => Promise.all(files.map(buildJS));

process.chdir(__dirname);
waterfall([listFiles, buildAll]).catch(e => {
  console.trace(e);
});
