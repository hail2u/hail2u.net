const fs = require("fs").promises;

const dest = "../dist/style-guide/index.html";
const resourceRe = /\b(href|src)="(\.\.|https:\/\/hail2u\.net)(\/.*?)"/g;
const rewriteURL = '$1="$3"';
const src = "../src/css/test.html";

const main = async () => {
  const html = await fs.readFile(src, "utf8");
  await fs.writeFile(dest, html.replace(resourceRe, rewriteURL));
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
