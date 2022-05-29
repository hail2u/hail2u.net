import {
	outputJSONFile,
	readJSONFile
} from "../lib/json-file.js";
import config from "../.config.js";
import { getDateDetails } from "../lib/get-date-details.js";
import minimist from "minimist";
import { openTwitter } from "../lib/open-twitter.js";
import { runCommand } from "../lib/run-command.js";

const main = async () => {
	const {
		comment,
		title,
		url
	} = minimist(process.argv.slice(2), {
		alias: {
			c: "comment",
			t: "title",
			u: "url"
		},
		default: {
			comment: "",
			title: "",
			url: ""
		},
		string: [
			"comment",
			"title",
			"url"
		]
	});

	if (!comment) {
		throw new Error("--comment is required.");
	}

	if (!title) {
		throw new Error("--title is required.");
	}

	if (!url) {
		throw new Error("--url is required.");
	}

	const file = config.data.links;
	const links = await readJSONFile(file);
	const published = Date.now();
	const dt = getDateDetails(published);
	await outputJSONFile(file, [
		{
			description: comment,
			link: url,
			published,
			...dt,
			title,
			type: "link"
		},
		...links
	]);
	await runCommand("git", [
		"add",
		"--",
		file
	]);
	await runCommand("git", [
		"commit",
		`--message=Bookmark ${url}`
	]);
	await openTwitter(`${comment} ${url}`);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
