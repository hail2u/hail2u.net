import config from "./index.js";
import { readJSONFile, writeJSONFile } from "../lib/json-file.js";
import runCommand from "../lib/run-command.js";
import which from "which";

const main = async () => {
	if (process.argv.length !== 3) {
		throw new Error("Status text must be passed. And there should not be any other options.");
	}

	const [statuses, git] = await Promise.all([
		readJSONFile(config.data.statuses, "utf8"),
		which("git")
	]);
	const text = process.argv.slice(2).shift();
	await writeJSONFile(config.data.statuses, [{
		published: Date.now(),
		text: text
	}, ...statuses]);
	await runCommand(git, ["add", "--", config.data.statuses]);
	await runCommand(git, ["commit", "--message=Update status"]);
};

main().catch(e => {
	console.trace(e);
	process.exitCode = 1;
});
