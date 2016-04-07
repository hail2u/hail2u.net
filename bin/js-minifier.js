#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");
var minifyJS = require("uglify-js").minify;
var path = require("path");

var t = "tmp/";

fs.readdirSync(t).forEach(function (i) {
  var m;
  var o;
  var r;
  var x = ".js";

  if (path.extname(i) !== x) {
    return;
  }

  o = path.join(path.dirname(i), path.basename(i, x) + ".min" + x);
  m = o + ".map";
  r = minifyJS(t + i, {
    output: {
      comments: /@preserve|@license|@cc_on/i,
    },
    outSourceMap: m
  });
  fs.outputFileSync(t + o, r.code);
  fs.outputFileSync(t + m, r.map);
});
