const fs = require("fs-extra");

const dest = "../dist/style-guide/index.html";
const dir = "../";
const resourceRe = /\b(href|src)(=)(")(.*?)(")/g;
const src = "../src/css/test.html";
const url = "https://hail2u.net/";

const rewriteURL = (m, a, e, o, u, c) => {
  if (u.startsWith(url)) {
    return `${a}${e}${o}${u.substr(url.length - 1)}${c}`;
  }

  if (u.startsWith(dir)) {
    return `${a}${e}${o}${u.substr(dir.length - 1)}${c}`;
  }

  return `${a}${e}${o}${u}${c}`;
};

const main = async () => {
  const html = await fs.readFile(src, "utf8");
  await fs.outputFile(dest, html.replace(resourceRe, rewriteURL));
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
