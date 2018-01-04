const fs = require("fs-extra");

const dir = "../";
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
  const html = await fs.readFile("../src/css/test.html", "utf8");
  await fs.outputFile(
    "../dist/style-guide/index.html",
    html.replace(/\b(href|src)(=)(")(.*?)(")/g, rewriteURL)
  );
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
