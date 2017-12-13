const fs = require("fs-extra");
const gccc = require("google-closure-compiler-js").compile;
const path = require("path");
const waterfall = require("../lib/waterfall");

const jsExt = ".js";
const isSameDest = (dest, file) => file.dest === dest;
const src = "../src/js/";
const generateFileMappings = (files, srcFile) => {
  if (path.extname(srcFile) !== jsExt) {
    return files;
  }

  const destFile = `${path
    .extname(path.basename(srcFile, jsExt))
    .replace(/^./, "")}${jsExt}`;
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
const listFiles = () =>
  new Promise((resolve, reject) => {
    fs.readdir(src, (e, f) => {
      if (e) {
        return reject(e);
      }

      resolve(f.reduce(generateFileMappings, []));
    });
  });
const readJS = file =>
  new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve(d);
    });
  });
const tmp = "../tmp/";
const gatherJS = file =>
  Promise.all(file.src.map(readJS)).then(r => {
    file.contents = r.join("");
    file.dest = path.join(tmp, file.dest);

    return file;
  });
const writeJS = file =>
  new Promise((resolve, reject) => {
    fs.outputFile(file.dest, file.contents, e => {
      if (e) {
        return reject(e);
      }

      resolve(file);
    });
  });
const config = {
  compilationLevel: "ADVANCED",
  outputWrapper: "(function () {%output%}).call(window);"
};
const minExt = ".min";
const compileJS = file => {
  file.contents = gccc(
    Object.assign({}, config, {
      jsCode: [
        {
          src: file.contents
        }
      ]
    })
  ).compiledCode;
  file.dest = path.join(
    tmp,
    `${path.basename(file.dest, jsExt)}${minExt}${jsExt}`
  );

  return file;
};
const buildJS = file =>
  waterfall([gatherJS, writeJS, compileJS, writeJS], file);
const buildAll = files => Promise.all(files.map(buildJS));

process.chdir(__dirname);
waterfall([listFiles, buildAll]).catch(e => {
  console.trace(e);
});
