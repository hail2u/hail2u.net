"use strict";

const path = require("path");

module.exports = (p) => {
  if (path.sep === "/") {
    return p;
  }

  return p.replace(/\\/g, "/");
};
