const ClosureCompiler = require("google-closure-compiler").jsCompiler;
const fs = require("fs").promises;
const path = require("path");

const compiler = new ClosureCompiler({
  isolationMode: "IIFE",
  languageIn: "ECMASCRIPT_2018",
  languageOut: "ECMASCRIPT5_STRICT"
});
const destDir = "../dist/js/";
const srcDir = "../src/js/";

const compileJS = jsCode => new Promise((resolve, reject) => {
  compiler.run(jsCode, (exitCode, stdOut, stdErr) => {
    if (exitCode !== 0) {
      return reject(stdErr);
    }

    return resolve(stdOut[0].src);
  });
});

const buildJS = async filename => {
  if (!filename.endsWith(".js")) {
    return;
  }

  const src = path.join(srcDir, filename);
  const code = await fs.readFile(src, "utf8");
  const compiled = await compileJS([
    {
      sourceMap: null,
      src: code
    }
  ]);
  const dest = path.join(destDir, filename);
  await fs.writeFile(dest, compiled);
};

const main = async () => {
  const filenames = await fs.readdir(srcDir);
  Promise.all(filenames.map(buildJS));
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
