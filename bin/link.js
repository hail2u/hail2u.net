import {
	readJSONFile,
	writeJSONFile
} from "../lib/json-file.js";
import config from "./config.js";
import fs from "fs/promises";
import minimist from "minimist";
import path from "path";
import {
	runCommand
} from "../lib/run-command.js";

const isFollowed = (url, following) => url === following.url;

const shuffleArray = (array) => {
	const shuffled = [...array];

	for (let i = array.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));

		if (i === j) {
			continue;
		}

		[
			shuffled[i],
			shuffled[j]
		] = [
			shuffled[j],
			shuffled[i]
		];
	}

	return shuffled;
};

const addFollowing = async (feed, title, url) => {
	const followings = await readJSONFile(config.data.followings);

	if (followings.find(isFollowed.bind(null, url))) {
		throw new Error(`${title} has already been followed.`);
	}

	return [
		config.data.followings,
		[
			{
				"feed": feed,
				"title": title,
				"url": url
			},
			...shuffleArray(followings)
		],
		`Follow ${url}`
	];
};

const addLink = async (comment, title, url) => {
	const links = await readJSONFile(config.data.links);
	return [
		config.data.links,
		[
			{
				"comment": comment,
				"published": Date.now(),
				"title": title,
				"url": url
			},
			...links
		],
		`Bookmark ${url}`
	];
};

const addThing = ({
	comment,
	feed,
	title,
	url
}) => {
	if (feed && title && url) {
		return addFollowing(feed, title, url);
	}

	if (comment && title && url) {
		return addLink(comment, title, url);
	}

	throw new Error("--title, --url, and --coment or --feed are required.");
};

const main = async () => {
	const argv = minimist(process.argv.slice(2), {
		"alias": {
			"c": "comment",
			"f": "feed",
			"t": "title",
			"u": "url"
		},
		"default": {
			"comment": "",
			"feed": "",
			"title": "",
			"url": ""
		},
		"string": [
			"comment",
			"feed",
			"title",
			"url"
		]
	});
	const [
		file,
		data,
		message
	] = await addThing(argv);
	await fs.mkdir(path.dirname(file), {
		recursive: true
	});
	await writeJSONFile(file, data);
	await runCommand("git", [
		"add",
		"--",
		file
	]);
	await runCommand("git", [
		"commit",
		`--message=${message}`
	]);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
