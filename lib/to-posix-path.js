const path = require("path");

module.exports = filepath => {
  if (path.sep === path.posix.sep) {
    return filepath;
  }

  return filepath.replace(
    new RegExp(`\\${path.win32.sep}`, "g"),
    path.posix.sep
  );
};
