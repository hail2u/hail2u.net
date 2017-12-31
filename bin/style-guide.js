const fs = require("fs-extra");

const dir = "../";
const url = "https://hail2u.net/";

const readStyleGuide = () => fs.readFile("../src/css/test.html", "utf8");

const rewriteURL = (m, a, e, o, u, c) => {
  if (u.startsWith(url)) {
    return `${a}${e}${o}${u.substr(url.length - 1)}${c}`;
  }

  if (u.startsWith(dir)) {
    return `${a}${e}${o}${u.substr(dir.length - 1)}${c}`;
  }

  return `${a}${e}${o}${u}${c}`;
};

const writeStyleGuide = contents =>
  fs.outputFile("../dist/style-guide/index.html", contents);

const main = async () => {
  let styleGuide = await readStyleGuide();

  styleGuide = styleGuide.replace(/\b(href|src)(=)(")(.*?)(")/g, rewriteURL);
  writeStyleGuide(styleGuide);
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
