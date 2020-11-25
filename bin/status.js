import { readJSONFile, writeJSONFile } from "../lib/json-file.js";
import config from "./config.js";
import fs from "fs/promises";
import minimist from "minimist";
import path from "path";
import { runCommand } from "../lib/run-command.js";

const addStatus = async (status) => {
	const statuses = await readJSONFile(config.data.statuses, "utf8");
	return [
		config.data.statuses,
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
	const { _: remains } = minimist(process.argv.slice(2));

	if (remains.length !== 1) {
		throw new Error(`Only 1 argumet is required.`);
	}

	const [status] = remains;
	const [file, data, message] = await addStatus(status);
	await fs.mkdir(path.dirname(file), {
		recursive: true,
	});
	await writeJSONFile(file, data);
	await runCommand("git", ["add", "--", file]);
	await runCommand("git", ["commit", `--message=${message}`]);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
