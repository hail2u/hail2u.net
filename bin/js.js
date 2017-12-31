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

const gatherJS = async file => {
  await Promise.all(file.src.map(readJS));

  return file;
};

const writeJS = file =>
  fs.outputFile(
    file.dest,
    compile({
      ...config,
      ...{
        jsCode: file.src
      }
    }).compiledCode
  );

const buildJS = async file => {
  file = await gatherJS(file);
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
