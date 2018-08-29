// IE 11 and Edge 17 and lower cannot load `@font-face` rules that are not
// written at root.
const postcss = require("postcss");

module.exports = postcss.plugin("move-font-faces", () => css => {
  const faces = [];
  css.walkAtRules("font-face", r => {
    faces.push(r);
  });
  css.append(faces);
});
