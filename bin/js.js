const fs = require("fs-extra");
const { compile } = require("google-closure-compiler-js");

const config = {
  compilationLevel: "ADVANCED",
  outputWrapper: "(function () {%output%}).call(window);"
};
const files = [
  {
    dest: "../tmp/async.min.js",
    src: ["../src/js/unutm.js"]
  },
  {
    dest: "../tmp/defer.min.js",
    src: ["../src/js/ellipsis-title.js", "../src/js/reldate.js"]
  },
  {
    dest: "../tmp/debug.min.js",
    src: [
      "../src/js/toggle-outline.js",
      "../src/js/toggle-column.js",
      "../src/js/toggle-eyecatch.js"
    ]
  }
];

const readSrc = srcpath => fs.readFile(srcpath, "utf8");

const gatherJS = srcs => Promise.all(srcs.map(readSrc));

const buildJSCode = src => ({
  src: src
});

const compileJS = jscode =>
  compile({
    ...config,
    jsCode: jscode
  }).compiledCode;

const buildJS = async file => {
  const srcs = await gatherJS(file.src);
  const jscode = await Promise.all(srcs.map(buildJSCode));
  const js = compileJS(jscode);
  await fs.outputFile(file.dest, js);
};

process.chdir(__dirname);
Promise.all(files.map(buildJS)).catch(e => {
  console.trace(e);
});
