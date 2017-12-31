const fs = require("fs-extra");
const { compile } = require("google-closure-compiler-js");
const path = require("path");

const config = {
  compilationLevel: "ADVANCED",
  outputWrapper: "(function () {%output%}).call(window);"
};
const jsExt = ".js";
const minExt = ".min";
const src = "../src/js/";
const tmp = "../tmp/";

const toFilePath = filename => path.join(src, filename);

const isSameDest = (dest, file) => file.dest === dest;

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

  return files.map(toFilePath).reduce(generateFileMappings, []);
};

const readJS = srcFile => fs.readFile(srcFile, "utf8");

const gatherJS = file => Promise.all(file.src.map(readJS));

const compileJS = file =>
  compile({
    ...config,
    ...{
      jsCode: file.src
    }
  }).compiledCode;

const writeJS = file => fs.outputFile(file.dest, file.contents);

const buildJS = async file => {
  file.src = await gatherJS(file);
  file.contents = compileJS(file);
  writeJS(file);
};

const main = async () => {
  const files = await listFiles();

  Promise.all(files.map(buildJS));
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
