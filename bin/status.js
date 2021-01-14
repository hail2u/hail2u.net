import { outputJSONFile, readJSONFile } from "../lib/json-file.js";
import config from "../.config.js";
import minimist from "minimist";
import { runCommand } from "../lib/run-command.js";

const addStatus = async (status) => {
	const statuses = await readJSONFile(config.paths.data.statuses, "utf8");
	return [
		config.paths.data.statuses,
		[
			{
				published: Date.now(),
				text: status,
			},
			...statuses,
		],
		"Update status",
	];
};

const main = async () => {
	const { _: [status] } = minimist(process.argv.slice(2));

	if (!status) {
		throw new Error(`Only 1 argumet is required.`);
	}

	const [file, data, message] = await addStatus(status);
	await outputJSONFile(file, data);
	await runCommand("git", ["add", "--", file]);
	await runCommand("git", ["commit", `--message=${message}`]);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
