const path = require("path");

module.exports = filepath => {
  if (path.sep === path.posix.sep) {
    return filepath;
  }

  const reWin32Sep = new RegExp(`\\${path.win32.sep}`, "g");
  return filepath.replace(reWin32Sep, path.posix.sep);
};
