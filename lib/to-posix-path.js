const path = require("path");

module.exports = filepath => {
  if (path.sep === "/") {
    return filepath;
  }

  return filepath.replace(/\\/g, "/");
};
