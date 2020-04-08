import config from "./index.js";
import minimist from "minimist";
import { readJSONFile, writeJSONFile } from "../lib/json-file.js";
import runCommand from "../lib/run-command.js";
import which from "which";

const main = async () => {
	const argv = minimist(process.argv.slice(2), {
		alias: {
			f: "feed",
			t: "title",
			u: "url"
		},
		default: {
			feed: "",
			title: "",
			url: ""
		},
		string: ["feed", "title", "url"]
	});

	if (!argv.feed) {
		throw new Error("Feed URL must be passed.");
	}

	if (!argv.title) {
		throw new Error("Webpage title must be passed.");
	}

	if (!argv.url) {
		throw new Error("Webpage URL must be passed.");
	}

	const [followings, git] = await Promise.all([
		readJSONFile(config.data.followings),
		which("git")
	]);
	await writeJSONFile(config.data.followings, [{
		feed: argv.feed,
		title: argv.title,
		url: argv.url
	}, ...followings]);
	await runCommand(git, ["add", "--", config.data.followings]);
	await runCommand(git, ["commit", `--message=Follow ${argv.url}`]);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
