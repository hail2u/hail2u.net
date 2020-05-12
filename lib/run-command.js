import {execFile} from "child_process";
import {promisify} from "util";

const execFileAsync = promisify(execFile);

export default async (command, args) => {
	const {stdout} = await execFileAsync(command, args);
	return process.stdout.write(stdout);
};
