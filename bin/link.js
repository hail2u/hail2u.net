import config from "./index.js";
import minimist from "minimist";
import { readJSONFile, writeJSONFile } from "../lib/json-file.js";
import runCommand from "../lib/run-command.js";
import which from "which";

const main = async () => {
	const argv = minimist(process.argv.slice(2), {
		alias: {
			t: "title",
			u: "url"
		},
		default: {
			title: "",
			url: ""
		},
		string: ["title", "url"]
	});

	if (!argv.title) {
		throw new Error("Webpage title must be passed.");
	}

	if (!argv.url) {
		throw new Error("Webpage URL must be passed.");
	}

	const [links, git] = await Promise.all([
		readJSONFile(config.data.links),
		which("git")
	]);
	await writeJSONFile(config.data.links, [{
		published: Date.now(),
		title: argv.title,
		url: argv.url
	}, ...links]);
	await runCommand(git, ["add", "--", config.data.links]);
	await runCommand(git, ["commit", `--message=Bookmark ${argv.url}`]);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
