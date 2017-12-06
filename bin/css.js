const atImport = require("postcss-import");
const csswring = require("csswring");
const fs = require("fs-extra");
const mqpacker = require("css-mqpacker");
const postcss = require("postcss");
const waterfall = require("../lib/waterfall");
const wrapWithSupports = require("../lib/wrap-with-supports");

const files = [
  {
    dest: "../tmp/main.min.css",
    src: "../src/css/main.css"
  },
  {
    dest: "../tmp/debug.min.css",
    src: "../src/css/debug.css"
  },
  {
    dest: "../dist/style-guide/index.html",
    src: "../src/css/test.html"
  }
];
const processor = postcss([
  atImport(),
  mqpacker(),
  csswring(),
  wrapWithSupports()
]);

function readFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file.src, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      file.contents = d;
      resolve(file);
    });
  });
}

function modifyStyleGuide(contents) {
  const dir = "../";
  const url = "https://hail2u.net/";

  return contents.replace(/\b(href|src)(=)(")(.*?)(")/g, (m, a, e, o, u, c) => {
    if (u.startsWith(url)) {
      u = u.substr(url.length - 1);
    } else if (u.startsWith(dir)) {
      u = u.substr(dir.length - 1);
    }

    return `${a}${e}${o}${u}${c}`;
  });
}

function optimizeFile(file) {
  if (!file.src.endsWith(".css")) {
    file.contents = modifyStyleGuide(file.contents);

    return file;
  }

  return processor.process(file.contents, {
    from: file.src,
    to: file.dest
  })
    .then((r) => {
      file.contents = r.css;

      return file;
    });
}

function writeFile(file) {
  return new Promise((resolve, reject) => {
    fs.outputFile(file.dest, file.contents, (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

function buildFile(file) {
  return waterfall([
    readFile,
    optimizeFile,
    writeFile
  ], file);
}

process.chdir(__dirname);
Promise.all(files.map(buildFile))
  .catch((e) => {
    console.trace(e);
  });
