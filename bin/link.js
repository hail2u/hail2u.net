import { outputJSONFile, readJSONFile } from "../lib/json-file.js";
import config from "../.config.js";
import minimist from "minimist";
import { runCommand } from "../lib/run-command.js";

const addLink = async (comment, title, url) => {
	const links = await readJSONFile(config.paths.data.links);
	return [
		config.paths.data.links,
		[
			{
				comment,
				published: Date.now(),
				title,
				url,
			},
			...links,
		],
		`Bookmark ${url}`,
	];
};

const main = async () => {
	const { comment, title, url } = minimist(process.argv.slice(2), {
		alias: {
			c: "comment",
			t: "title",
			u: "url",
		},
		default: {
			comment: "",
			title: "",
			url: "",
		},
		string: ["comment", "title", "url"],
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

	const [file, data, message] = await addLink(comment, title, url);
	await outputJSONFile(file, data);
	await runCommand("git", ["add", "--", file]);
	await runCommand("git", ["commit", `--message=${message}`]);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
