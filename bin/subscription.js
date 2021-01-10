import { outputJSONFile, readJSONFile } from "../lib/json-file.js";
import config from "../.config.js";
import minimist from "minimist";
import { runCommand } from "../lib/run-command.js";
import { shuffleArray } from "../lib/shuffle-array.js";

const isSubscribed = (url, subscription) => url === subscription.url;

const addSubscription = async ({ feed, title, url }) => {
	const subscriptions = await readJSONFile(config.paths.data.subscriptions);

	if (subscriptions.find(isSubscribed.bind(null, url))) {
		throw new Error(`${title} has already been subscribed.`);
	}

	return [
		config.paths.data.subscriptions,
		[
			{
				feed,
				title,
				url,
			},
			...shuffleArray(subscriptions),
		],
		`Subscribe ${url}`,
	];
};

const main = async () => {
	const argv = minimist(process.argv.slice(2), {
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

	if (!argv.feed) {
		throw new Error("--feed is required.");
	}

	if (!argv.title) {
		throw new Error("--title is required.");
	}

	if (!argv.url) {
		throw new Error("--url is required.");
	}

	const [file, data, message] = await addSubscription(argv);
	await outputJSONFile(file, data);
	await runCommand("git", ["add", "--", file]);
	await runCommand("git", ["commit", `--message=${message}`]);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
