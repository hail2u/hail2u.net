"use strict";

var feedmix = require("feedmix");
var fs = require("fs-extra");

fs.outputFileSync("dist/feed", feedmix.stringify(feedmix.merge([
  fs.readFileSync("src/index.rss"),
  fs.readFileSync("dist/blog/feed")
], {
  trim: true
}), {
  cdata: true,
  xmldec: {
    encoding: "UTF-8",
    version: "1.0"
  }
}) + "\n");
