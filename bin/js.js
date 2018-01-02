const fs = require("fs-extra");
const { compile } = require("google-closure-compiler-js");
const path = require("path");

const config = {
  compilationLevel: "ADVANCED",
  outputWrapper: "(function () {%output%}).call(window);"
};
const jsExt = ".js";
const minExt = ".min";
const srcDir = "../src/js/";
const tmpDir = "../tmp/";

const isSameDest = (dest, file) => file.dest === dest;

const generateFileMappings = (files, filename) => {
  if (path.extname(filename) !== jsExt) {
    return files;
  }

  const src = path.join(srcDir, filename);
  const dest = path.join(
    tmpDir,
    `${path
      .extname(path.basename(src, jsExt))
      .replace(/^./, "")}${minExt}${jsExt}`
  );
  const target = files.find(isSameDest.bind(null, dest));

  if (target) {
    target.src = target.src.concat(src);
    return files;
  }

  return files.concat({
    dest: dest,
    src: [src]
  });
};

const listFiles = async () => {
  const filenames = await fs.readdir(srcDir);
  return filenames.reduce(generateFileMappings, []);
};

const readJS = filepath => fs.readFile(filepath, "utf8");

const gatherJS = srcs => Promise.all(srcs.map(readJS));

const buildJSCode = src => ({
  src: src
});

const compileJS = jscode =>
  compile({
    ...config,
    ...{
      jsCode: jscode
    }
  }).compiledCode;

const writeJS = (filepath, js) => fs.outputFile(filepath, js);

const buildJS = async file => {
  const srcs = await gatherJS(file.src);
  const jscode = srcs.map(buildJSCode);
  const js = compileJS(jscode);
  await writeJS(file.dest, js);
};

const main = async () => {
  const files = await listFiles();
  return Promise.all(files.map(buildJS));
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
