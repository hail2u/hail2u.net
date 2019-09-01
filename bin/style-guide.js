const fs = require("fs").promises;

const dest = "../dist/style-guide/index.html";
const src = "../src/css/test.html";

const main = async () => {
  const html = await fs.readFile(src, "utf8");
  await fs.writeFile(
    dest,
    html.replace(
      /\b(href|src)="(\.\.|https:\/\/hail2u\.net)(\/.*?)"/g,
      '$1="$3"'
    )
  );
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
