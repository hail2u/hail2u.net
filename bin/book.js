import { outputJSONFile, readJSONFile } from "../lib/json-file.js";
import config from "./config.js";
import fetch from "node-fetch";
import minimist from "minimist";
import path from "path";
import { runCommand } from "../lib/run-command.js";
import sharp from "sharp";

const isReadBook = (asin, book) => asin === book.asin;

const addBook = async (asin, title) => {
	if (!/^[A-Z0-9]{10}$/iu.test(asin)) {
		throw new Error(`${asin} is not consisted of 10 alphanumeric characters.`);
	}

	const books = await readJSONFile(config.data.books);

	if (books.find(isReadBook.bind(null, asin))) {
		throw new Error(`${title} has already been added.`);
	}

	const [saver, res] = await Promise.all([
		sharp(),
		fetch(`https://m.media-amazon.com/images/P/${asin}.jpg`),
	]);
	res.body.pipe(saver);
	const fn = path.join(config.dest.temp, `${asin}.jpg`);
	const [metadata] = await Promise.all([saver.metadata(), saver.toFile(fn)]);

	if (metadata.height === 1 && metadata.width === 1) {
		throw new Error(`${title} does not have a cover image.`);
	}

	return [
		config.data.books,
		[
			{
				asin,
				height: metadata.height,
				published: Date.now(),
				title,
				width: metadata.width,
			},
			...books,
		],
		`Read ${asin}`,
	];
};

const main = async () => {
	const { asin, title } = minimist(process.argv.slice(2), {
		alias: {
			a: "asin",
			t: "title",
		},
		default: {
			asin: "",
			title: "",
		},
		string: ["asin", "title"],
	});

	if (!asin || !title) {
		throw new Error("--asin and --title are required.");
	}

	const [file, data, message] = await addBook(asin, title);
	await outputJSONFile(file, data);
	await runCommand("git", ["add", "--", file]);
	await runCommand("git", ["commit", `--message=${message}`]);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
