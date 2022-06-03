import {
	outputJSONFile,
	readJSONFile
} from "../lib/json-file.js";
import config from "../.config.js";
import { getDateDetails } from "../lib/get-date-details.js";
import { openTwitter } from "../lib/open-twitter.js";
import { parseArgs } from "node:util";
import { runCommand } from "../lib/run-command.js";

const main = async () => {
	const {
		positionals: [ text ]
	} = parseArgs({
		strict: false
	});

	if (!text) {
		throw new Error("Only 1 argument is required.");
	}

	const file = config.contents.statuses;
	const statuses = await readJSONFile(file);
	const published = Date.now();
	const dt = getDateDetails(published);
	await outputJSONFile(file, [
		{
			description: text,
			link: `/statuses/#on-${published}`,
			published,
			...dt,
			title: text,
			type: "status"
		},
		...statuses
	]);
	await runCommand("git", [
		"add",
		"--",
		file
	]);
	await runCommand("git", [
		"commit",
		"--message=Update status",
		`--message=${text}`
	]);
	await openTwitter(text);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
