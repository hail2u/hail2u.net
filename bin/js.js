const ClosureCompiler = require("google-closure-compiler").jsCompiler;
const fs = require("fs").promises;

const compiler = new ClosureCompiler({
  compilationLevel: "ADVANCED_OPTIMIZATIONS",
  languageIn: "ECMASCRIPT_2017",
  languageOut: "ECMASCRIPT5_STRICT",
  outputWrapper: "(function(){\n%output%\n}).call(this);"
});

const files = [
  {
    dest: "../src/partial/js.mustache",
    src: ["../src/js/dark-mode.js"]
  },
  {
    dest: "../tmp/main.min.js",
    src: ["../src/js/reldate.js", "../src/js/unutm.js"]
  }
];

const buildJSCode = async src => {
  const js = await fs.readFile(src, "utf8");
  return {
    sourceMap: null,
    src: js
  };
};

const compileJS = jsCode => new Promise((resolve, reject) => {
  compiler.run(jsCode, (exitCode, stdOut, stdErr) => {
    if (exitCode !== 0) {
      return reject(stdErr);
    }

    return resolve(stdOut[0].src);
  });
});

const buildJS = async file => {
  const jsCode = await Promise.all(file.src.map(buildJSCode));
  const compiled = await compileJS(jsCode);
  await fs.writeFile(file.dest, compiled);
};

process.chdir(__dirname);
Promise.all(files.map(buildJS)).catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
