import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const runCommand = async (command, args) => {
  const { stderr, stdout } = await execFileAsync(command, args);

  if (stderr) {
    process.stderr.write(stderr);
  }

  return process.stdout.write(stdout);
};

export { runCommand };
