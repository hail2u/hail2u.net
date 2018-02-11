const fs = require("fs-extra");

const dest = "../dist/style-guide/index.html";
const resourceRe = /\b(href|src)(=)(")(.*?)(")/g;
const rootDir = "../";
const rootURL = "https://hail2u.net/";
const src = "../src/css/test.html";

const rewriteURL = (whole, attr, eq, oq, url, cq) => {
  if (url.startsWith(rootURL)) {
    return `${attr}${eq}${oq}${url.substr(rootURL.length - 1)}${cq}`;
  }

  if (url.startsWith(rootDir)) {
    return `${attr}${eq}${oq}${url.substr(rootDir.length - 1)}${cq}`;
  }

  return `${attr}${eq}${oq}${url}${cq}`;
};

const main = async () => {
  const html = await fs.readFile(src, "utf8");
  await fs.outputFile(dest, html.replace(resourceRe, rewriteURL));
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
