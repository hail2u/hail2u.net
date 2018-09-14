const fs = require("fs").promises;
const { compile } = require("google-closure-compiler-js");

const config = {
  compilationLevel: "ADVANCED",
  languageIn: "ECMASCRIPT_2017",
  languageOut: "ECMASCRIPT5_STRICT",
  outputWrapper: "(function(){\n%output%\n}).call(this);"
};
const files = [
  {
    dest: "../src/partial/js.mustache",
    src: ["../src/js/night-mode.js"]
  },
  {
    dest: "../tmp/main.min.js",
    src: ["../src/js/reldate.js", "../src/js/unutm.js"]
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
  await fs.writeFile(file.dest, js);
};

process.chdir(__dirname);
Promise.all(files.map(buildJS)).catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
