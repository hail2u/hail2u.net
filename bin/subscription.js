import { outputJSONFile, readJSONFile } from "../lib/json-file.js";
import config from "../.config.js";
import minimist from "minimist";
import { openTwitter } from "../lib/open-twitter.js";
import { runCommand } from "../lib/run-command.js";
import { shuffleArray } from "../lib/shuffle-array.js";

const isSubscribed = (url, subscription) => url === subscription.url;

const main = async () => {
	const { feed, title, url } = minimist(process.argv.slice(2), {
		alias: {
			f: "feed",
			t: "title",
			u: "url",
		},
		default: {
			feed: "",
			title: "",
			url: "",
		},
		string: ["feed", "title", "url"],
	});

	if (!feed) {
		throw new Error("--feed is required.");
	}

	if (!title) {
		throw new Error("--title is required.");
	}

	if (!url) {
		throw new Error("--url is required.");
	}

	const file = config.paths.data.subscriptions;
	const subscriptions = await readJSONFile(file);

	if (subscriptions.find(isSubscribed.bind(null, url))) {
		throw new Error(`${title} has already been subscribed.`);
	}

	const shuffled = shuffleArray([
		{
			feed,
			link: url,
			title,
		},
		...subscriptions,
	]);
	await outputJSONFile(file, shuffled);
	await runCommand("git", ["add", "--", file]);
	await runCommand("git", ["commit", `--message=Subscribe ${url}`]);
	await openTwitter(`「${title}」を購読開始 ${url}`);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
