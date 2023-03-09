import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const runCommand = async (command, args) => {
  const { stdout } = await execFileAsync(command, args);
  return process.stdout.write(stdout);
};

export { runCommand };
