const { execFile } = require("child_process");
const util = require("util");

module.exports = util.promisify(execFile);
