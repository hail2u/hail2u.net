"use strict";

const postcss = require("postcss");

module.exports = postcss.plugin("wrap-with-supports", () => {
  return (css) => {
    const supports = postcss.parse("@supports(top:0){}");

    css.each((n) => {
      supports.first.append(n);
    });
    css.append(supports);
  };
});
