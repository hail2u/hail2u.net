import googleClosureCompiler from "google-closure-compiler";
import config from "./index.js";
import { promises as fs } from "fs";
import getVersion from "../lib/get-version.js";

const ClosureCompiler = googleClosureCompiler.jsCompiler;
const compiler = new ClosureCompiler({
  formatting: "PRETTY_PRINT",
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

const buildJS = async file => {
  const code = await fs.readFile(file.src, "utf8");
  const [version, compiled] = await Promise.all([
    getVersion(),
    compileJS([
      {
        sourceMap: null,
        src: code
      }
    ])
  ]);
  const dest = file.dest.replace(/{{version}}/g, version);
  await fs.writeFile(dest, compiled);
};

Promise.all(config.files.js.map(buildJS)).catch(e => {
  console.trace(e);
  process.exitCode = 1;
});
