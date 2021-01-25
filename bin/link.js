import { outputJSONFile, readJSONFile } from "../lib/json-file.js";
import config from "../.config.js";
import minimist from "minimist";
import { runCommand } from "../lib/run-command.js";

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

	const file = config.paths.data.links;
	const links = await readJSONFile(file);
	await outputJSONFile(file, [
		{
			comment,
			published: Date.now(),
			title,
			url,
		},
		...links,
	]);
	await runCommand("git", ["add", "--", file]);
	await runCommand("git", ["commit", `--message=Bookmark ${url}`]);
	const text = encodeURIComponent(`${comment} ${url}`);
	await runCommand("open", [`twitter://post?text=${text}`]);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
