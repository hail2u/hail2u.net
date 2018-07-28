const postcss = require("postcss");

module.exports = postcss.plugin("move-font-faces", () => css => {
  const faces = [];
  css.walkAtRules("font-face", r => {
    faces.push(r);
  });
  css.append(faces);
});
