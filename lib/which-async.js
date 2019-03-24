const { promisify } = require("util");
const which = require("which");

module.exports = promisify(which);
