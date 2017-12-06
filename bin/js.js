const fs = require("fs-extra");
const gccc = require("google-closure-compiler-js").compile;
const path = require("path");
const waterfall = require("../lib/waterfall");

const config = {
  compilationLevel: "ADVANCED",
  outputWrapper: "(function () {%output%}).call(window);"
};
const files = [
  {
    "dest": "debug.js",
    "src": [
      "../src/js/toggle-column.js",
      "../src/js/toggle-eyecatch.js",
      "../src/js/toggle-outline.js"
    ]
  },
  {
    "dest": "defer.js",
    "src": [
      "../src/js/ellipsis-title.js",
      "../src/js/reldate.js"
    ]
  },
  {
    "dest": "async.js",
    "src": [
      "../src/js/unutm.js"
    ]
  }
];
const jsExt = ".js";
const minExt = ".min";
const tmp = "../tmp/";

function readJS(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve(d);
    });
  });
}

function gatherJS(file) {
  return Promise.all(file.src.map(readJS))
    .then((r) => {
      file.contents = r.join("");
      file.dest = path.join(tmp, file.dest);

      return file;
    });
}

function writeJS(file) {
  return new Promise((resolve, reject) => {
    fs.outputFile(file.dest, file.contents, (e) => {
      if (e) {
        return reject(e);
      }

      resolve(file);
    });
  });
}

function compileJS(file) {
  file.contents = gccc(Object.assign({}, config, {
    jsCode: [{
      src: file.contents
    }]
  })).compiledCode;
  file.dest = path.join(tmp, `${path.basename(file.dest, jsExt)}${minExt}${jsExt}`);

  return file;
}

function buildJS(file) {
  return waterfall([
    gatherJS,
    writeJS,
    compileJS,
    writeJS
  ], file);
}

process.chdir(__dirname);
Promise.all(files.map(buildJS))
  .catch((e) => {
    console.trace(e);
  });
