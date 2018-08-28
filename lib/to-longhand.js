const list = require("postcss/lib/list");
const postcss = require("postcss");

const toCSW = (prop, values) => ({
  [`${prop}-color`]: values[2],
  [`${prop}-style`]: values[1],
  [`${prop}-width`]: values[0]
});

const toBLRT = (prop, values) => ({
  [`${prop}-bottom`]: values[2],
  [`${prop}-left`]: values[3],
  [`${prop}-right`]: values[1],
  [`${prop}-top`]: values[0]
});

const toFour = values => {
  if (values.length === 4) {
    return values;
  }

  if (values.length === 3) {
    return [...values, values[1]];
  }

  if (values.length === 2) {
    return [...values, ...values];
  }

  return [...values, ...values, ...values, ...values];
};

const spreadValue = (prop, value) => {
  if (prop.startsWith("border") || prop.startsWith("outline")) {
    return toCSW(prop, list.space(value));
  }

  return toBLRT(prop, toFour(list.space(value)));
};

const toDecl = (longhands, prop) =>
  postcss.decl({
    prop: prop,
    value: longhands[prop]
  });

module.exports = postcss.plugin("to-longhand", () => css => {
  css.walkDecls(
    /^(border(-(bottom|left|right|top))?|margin|outline|padding)$/,
    decl => {
      const longhands = spreadValue(decl.prop, decl.value);
      const decls = Object.keys(longhands).map(toDecl.bind(null, longhands));
      decl.parent.insertAfter(decl, decls);
      decl.remove();
    }
  );
});
