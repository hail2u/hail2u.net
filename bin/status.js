import { outputJSONFile, readJSONFile } from "../lib/json-file.js";
import config from "../.config.js";
import minimist from "minimist";
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
	const text = encodeURIComponent(status);
	await runCommand("open", [`twitter://post?text=${text}`]);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
