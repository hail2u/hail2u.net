"use strict";

const postcss = require("postcss");

module.exports = postcss.plugin("move-font-face", () => {
  return (css) => {
    const faces = [];

    css.walkAtRules("font-face", (r) => {
      faces.push(r);
    });
    css.append(faces);
  };
});
