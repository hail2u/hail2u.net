const path = require("path");

module.exports = filePath => {
  if (path.sep === "/") {
    return filePath;
  }

  return filePath.replace(/\\/g, "/");
};
