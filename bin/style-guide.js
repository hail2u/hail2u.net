const fs = require("fs-extra");
const waterfall = require("../lib/waterfall");

const readStyleGuide = () =>
  new Promise((resolve, reject) => {
    fs.readFile("../src/css/test.html", "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve(d);
    });
  });
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
const writeStyleGuide = contents =>
  new Promise((resolve, reject) => {
    fs.outputFile("../dist/style-guide/index.html", contents, e => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });

process.chdir(__dirname);
waterfall([readStyleGuide, modifyStyleGuide, writeStyleGuide]).catch(e => {
  console.trace(e);
});
