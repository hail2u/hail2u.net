const fs = require("fs-extra");

const dir = "../";
const url = "https://hail2u.net/";

const readStyleGuide = () => fs.readFile("../src/css/test.html", "utf8");

const rewriteURL = (m, a, e, o, u, c) => {
  if (u.startsWith(url)) {
    u = u.substr(url.length - 1);
  } else if (u.startsWith(dir)) {
    u = u.substr(dir.length - 1);
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
