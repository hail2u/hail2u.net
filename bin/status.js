import { outputJSONFile, readJSONFile } from "../lib/json-file.js";
import config from "../.config.js";
import minimist from "minimist";
import { openTwitter } from "../lib/open-twitter.js";
import { runCommand } from "../lib/run-command.js";

const main = async () => {
	const {
		_: [status],
	} = minimist(process.argv.slice(2));

	if (!status) {
		throw new Error(`Only 1 argument is required.`);
	}

	const file = config.paths.data.statuses;
	const statuses = await readJSONFile(file);
	await outputJSONFile(file, [
		{
			published: Date.now(),
			text: status,
		},
		...statuses,
	]);
	await runCommand("git", ["add", "--", file]);
	await runCommand("git", ["commit", `--message=Update status`]);
	await openTwitter(status);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
