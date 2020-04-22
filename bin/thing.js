import axios from "axios";
import config from "./index.js";
import fs from "fs/promises";
import minimist from "minimist";
import path from "path";
import { readJSONFile, writeJSONFile } from "../lib/json-file.js";
import runCommand from "../lib/run-command.js";
import sharp from "sharp";
import which from "which";

const commit = async (file, message) => {
	const git = await which("git");
	await runCommand(git, ["add", "--", file]);
	await runCommand(git, ["commit", `--message=${message}`]);
};

const addFollowing = async (feed, title, url) => {
	const followings = await readJSONFile(config.data.followings);
	await writeJSONFile(config.data.followings, [{
		feed: feed,
		title: title,
		url: url
	}, ...followings]);
	return commit(config.data.followings, `Follow ${url}`);
};

const isReadBook = (asin, book) => asin === book.asin;

const addBook = async (asin, title) => {
	if (!/^[A-Z0-9]{10}$/i.test(asin)) {
		throw new Error("ASIN must be 10 alphanumeric characters.");
	}

	const fn = path.join(config.dest.temp, `${asin}.jpg`);
	const [res, books] = await Promise.all([
		axios.get(`https://images-fe.ssl-images-amazon.com/images/P/${asin}.jpg`, {
			responseType: "arraybuffer"
		}),
		readJSONFile(config.data.books)
	]);

	if (books.find(isReadBook.bind(null, asin))) {
		throw new Error(`${asin} has already been added.`);
	}

	await fs.writeFile(fn, res.data);
	const metadata = await sharp(fn).metadata();
	await writeJSONFile(config.data.books, [{
		asin: asin,
		height: metadata.height,
		published: Date.now(),
		title: title,
		width: metadata.width
	}, ...books]);
	return commit(config.data.books, `Read ${asin}`);
};

const addLink = async (title, url) => {
	const links = await readJSONFile(config.data.links);
	await writeJSONFile(config.data.links, [{
		published: Date.now(),
		title: title,
		url: url
	}, ...links]);
	return commit(config.data.links, `Bookmark ${url}`);
};

const addPhoto = async (photo) => {
	const dt = new Date();
	const year = String(dt.getFullYear()).padStart(2, "0");
	const month = String(dt.getMonth() + 1).padStart(2, "0");
	const date = String(dt.getDate()).padStart(2, "0");
	const hours = String(dt.getHours()).padStart(2, "0");
	const minutes = String(dt.getMinutes()).padStart(2, "0");
	const seconds = String(dt.getSeconds()).padStart(2, "0");
	const fn = `${year}${month}${date}${hours}${minutes}${seconds}.jpg`;
	const src = path.join(config.src.photos, fn);
	await sharp(photo)
		.resize({
			width: 1280
		})
		.toFile(src);
	const dest = path.join(config.dest.photos, fn);
	await Promise.all([
		fs.copyFile(src, dest),
		fs.unlink(photo)
	]);
	return commit(src, `Add ${fn}`);
};

const addStatus = async (status) => {
	const statuses = await readJSONFile(config.data.statuses, "utf8");
	await writeJSONFile(config.data.statuses, [{
		published: Date.now(),
		text: status
	}, ...statuses]);
	return commit(config.data.statuses, "Update status");
};

const main = () => {
	const argv = minimist(process.argv.slice(2), {
		alias: {
			a: "asin",
			f: "feed",
			t: "title",
			u: "url"
		},
		default: {
			asin: "",
			feed: "",
			title: "",
			url: ""
		},
		string: ["asin", "feed", "title", "url"]
	});

	if (argv.feed && argv.title && argv.url) {
		return addFollowing(argv.feed, argv.title, argv.url);
	}

	if (argv.asin && argv.title) {
		return addBook(argv.asin, argv.title);
	}

	if (argv.title && argv.url) {
		return addLink(argv.title, argv.url);
	}

	if (argv._.length === 1) {
		const file = argv._[0].toLowerCase();

		if (file.endsWith(".jpg") || file.endsWith(".jpeg")) {
			return addPhoto(argv._[0]);
		}

		return addStatus(argv._[0]);
	}

	throw new Error(`Invalid arguemnts:
  ${process.argv}

To add:
  A book:      $ node thing.js --asin <ASIN> --title <TITLE>
  A following: $ node thing.js --feed <URL> --title <TITLE> --url <URL>
	A link:      $ node thins.js --title <TITLE> --url <URL>
	A photo:     $ node thing.js <FILE>
	A status:    $ node thing.js <TEXT>
`);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
