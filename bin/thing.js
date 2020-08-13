import {
	outputJSONFile,
	readJSONFile
} from "../lib/json-file.js";
import config from "./config.js";
import fetch from "node-fetch";
import fs from "fs/promises";
import minimist from "minimist";
import path from "path";
import {
	runCommand
} from "../lib/run-command.js";
import sharp from "sharp";

const isReadBook = (asin, book) => asin === book.asin;

const addBook = async (asin, title) => {
	if (!/^[A-Z0-9]{10}$/i.test(asin)) {
		throw new Error("${asin} is not consisted of 10 alphanumeric characters.");
	}

	const books = await readJSONFile(config.data.books);

	if (books.find(isReadBook.bind(null, asin))) {
		throw new Error(`${title} has already been added.`);
	}

	const [
		saver,
		res
	] = await Promise.all([
		sharp(),
		fetch(`https://images-fe.ssl-images-amazon.com/images/P/${asin}.jpg`)
	]);
	res.body.pipe(saver);
	const fn = path.join(config.dest.temp, `${asin}.jpg`);
	const [metadata] = await Promise.all([
		saver.metadata(),
		saver.toFile(fn)
	]);
	await outputJSONFile(config.data.books, [
		{
			"asin": asin,
			"height": metadata.height,
			"published": Date.now(),
			"title": title,
			"width": metadata.width
		},
		...books
	]);
	return [
		`Read ${asin}`,
		config.data.books
	];
};

const isFollowed = (url, following) => url === following.url;

const addFollowing = async (feed, title, url) => {
	const followings = await readJSONFile(config.data.followings);

	if (followings.find(isFollowed.bind(null, url))) {
		throw new Error(`${title} has already been followed.`);
	}

	await outputJSONFile(config.data.followings, [
		{
			"feed": feed,
			"title": title,
			"url": url
		},
		...followings
	]);
	return [
		`Follow ${url}`,
		config.data.followings
	];
};

const addLink = async (comment, title, url) => {
	const links = await readJSONFile(config.data.links);
	await outputJSONFile(config.data.links, [
		{
			"comment": comment,
			"published": Date.now(),
			"title": title,
			"url": url
		},
		...links
	]);
	return [
		`Bookmark ${url}`,
		config.data.links
	];
};

const addPhoto = async (photo, ext) => {
	const dt = new Date();
	const year = String(dt.getFullYear()).padStart(2, "0");
	const month = String(dt.getMonth() + 1).padStart(2, "0");
	const date = String(dt.getDate()).padStart(2, "0");
	const hours = String(dt.getHours()).padStart(2, "0");
	const minutes = String(dt.getMinutes()).padStart(2, "0");
	const seconds = String(dt.getSeconds()).padStart(2, "0");
	const fn = `${year}${month}${date}${hours}${minutes}${seconds}${ext}`;
	const src = path.join(config.src.photos, fn);
	const [photos] = await Promise.all([
		readJSONFile(config.data.photos, "utf8"),
		sharp(photo).resize({
			"width": 1280
		})
			.toFile(src),
		fs.mkdir(config.dest.photos, {
			"recursive": true
		})
	]);
	const metadata = await sharp(src).metadata();
	const dest = path.join(config.dest.photos, fn);
	await Promise.all([
		fs.copyFile(src, dest),
		fs.unlink(photo),
		outputJSONFile(config.data.photos, [
			{
				"height": metadata.height,
				"link": `/img/photos/${fn}`,
				"published": Date.now(),
				"title": path.basename(photo, ext),
				"width": metadata.width
			},
			...photos
		])
	]);
	return [
		`Add ${fn}`,
		src,
		config.data.photos
	];
};

const addStatus = async (status) => {
	const statuses = await readJSONFile(config.data.statuses, "utf8");
	await outputJSONFile(config.data.statuses, [
		{
			"published": Date.now(),
			"text": status
		},
		...statuses
	]);
	return [
		"Update status",
		config.data.statuses
	];
};

const addThing = ({
	asin,
	comment,
	feed,
	title,
	url,
	"_": remains
}) => {
	if (asin && title) {
		return addBook(asin, title);
	}

	if (feed && title && url) {
		return addFollowing(feed, title, url);
	}

	if (comment && title && url) {
		return addLink(comment, title, url);
	}

	if (!asin && !comment && !feed && !title && !url && remains.length === 1) {
		const ext = path.extname(remains[0]).toLocaleLowerCase('en-US');

		if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
			return addPhoto(remains[0], ext);
		}

		return addStatus(remains[0]);
	}

	throw new Error(`Invalid arguemnts:
  ${process.argv}

To add:
  A book:      $ node thing.js --asin <ASIN> --title <TITLE>
  A following: $ node thing.js --feed <URL> --title <TITLE> --url <URL>
  A link:      $ node thins.js --comment <COMMENT> --title <TITLE> --url <URL>
  A photo:     $ node thing.js <FILE>
  A status:    $ node thing.js <TEXT>
`);
};

const main = async () => {
	const argv = minimist(process.argv.slice(2), {
		"alias": {
			"a": "asin",
			"c": "comment",
			"f": "feed",
			"t": "title",
			"u": "url"
		},
		"default": {
			"asin": "",
			"comment": "",
			"feed": "",
			"title": "",
			"url": ""
		},
		"string": [
			"asin",
			"comment",
			"feed",
			"title",
			"url"
		]
	});
	const [
		message,
		...files
	] = await addThing(argv);
	await runCommand("git", [
		"add",
		"--",
		...files
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
