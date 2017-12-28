const fs = require("fs-extra");

const readStyleGuide = async () => fs.readFile("../src/css/test.html", "utf8");
const modifyStyleGuide = contents => {
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
};
const writeStyleGuide = async contents =>
  fs.outputFile("../dist/style-guide/index.html", contents);
const main = async () => {
  let html = await readStyleGuide();

  html = await modifyStyleGuide(html);
  writeStyleGuide(html);
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
