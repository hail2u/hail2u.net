#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");
var path = require("path");
var postcss = require("postcss")([
  require("css-mqpacker")({
    sort: true
  }),
  require("csswring")(),
  require("postcss-single-charset")()
]);

var t = "tmp/";

fs.readdirSync(t).forEach(function (i) {
  var o;
  var x = ".css";

  if (path.extname(i) !== x) {
    return;
  }

  i = t + i;
  o = path.join(path.dirname(i), path.basename(i, x) + ".min" + x);
  postcss.process(fs.readFileSync(i, "utf8"), {
    from: i,
    map: {
      inline: false,
      sourcesContent: false
    },
    to: o
  }).then(function (result) {
    fs.outputFileSync(o, result.css);
    fs.outputFileSync(o + ".map", result.map);
  });
});
