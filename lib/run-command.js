const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

module.exports = async (command, args) => {
  const { stdout } = await execFileAsync(command, args);
  return process.stdout.write(stdout);
};
