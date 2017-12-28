const util = require("util");
const which = require("which");

module.exports = util.promisify(which);
