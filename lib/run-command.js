const execFileAsync = require("../lib/exec-file-async");

module.exports = async (command, args) => {
  const { stdout } = await execFileAsync(command, args);
  return process.stdout.write(stdout);
};
