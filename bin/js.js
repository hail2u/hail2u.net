const ClosureCompiler = require("google-closure-compiler").jsCompiler;
const config = require("./index.json");
const fs = require("fs").promises;
const { version } = require("../package.json");

const compiler = new ClosureCompiler({
  isolationMode: "IIFE",
  languageIn: "ECMASCRIPT_2019",
  languageOut: "ECMASCRIPT5_STRICT"
});

const compileJS = jsCode => new Promise((resolve, reject) => {
  compiler.run(jsCode, (exitCode, stdOut, stdErr) => {
    if (exitCode !== 0) {
      return reject(stdErr);
    }

    return resolve(stdOut[0].src);
  });
});

const versioning = filename => filename.replace(/{{version}}/g, version);

const buildJS = async file => {
  const code = await fs.readFile(file.src, "utf8");
  const compiled = await compileJS([
    {
      sourceMap: null,
      src: code
    }
  ]);
  await fs.writeFile(versioning(file.dest), compiled);
};

Promise.all(config.files.js.map(buildJS)).catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
