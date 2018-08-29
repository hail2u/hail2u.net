// Wrapping with `@supports` makes blocking CSS from IE11 and lower.
const postcss = require("postcss");

module.exports = postcss.plugin("wrap-with-supports", () => css => {
  const supports = postcss.parse("@supports(top:0){}");
  css.each(n => {
    supports.first.append(n);
  });
  css.append(supports);
});
