import { outputJSONFile, readJSONFile } from "../lib/json-file.js";
import config from "../.config.js";
import fetch from "node-fetch";
import minimist from "minimist";
import { runCommand } from "../lib/run-command.js";
import sharp from "sharp";

const isReadBook = (asin, book) => asin === book.asin;

const cancelFetch = (abortController) => {
	abortController.abort();
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

	if (!asin) {
		throw new Error("--asin is required.");
	}

	if (!title) {
		throw new Error("--title is required.");
	}

	if (!/^[A-Z0-9]{10}$/iu.test(asin)) {
		throw new Error(`${asin} is not consisted of 10 alphanumeric characters.`);
	}

	const file = config.paths.data.books;
	const books = await readJSONFile(file);

	if (books.find(isReadBook.bind(null, asin))) {
		throw new Error(`${title} has already been added.`);
	}

	const abortController = new AbortController();
	const abortID = setTimeout(cancelFetch.bind(null, abortController), 5000);

	try {
		const [res, saver] = await Promise.all([
			fetch(`https://m.media-amazon.com/images/P/${asin}.jpg`, {
				signal: abortController.signal,
			}),
			sharp(),
		]);
		res.body.pipe(saver);
		const metadata = await saver.metadata();

		if (metadata.height === 1 && metadata.width === 1) {
			throw new Error(`${title} does not have a cover image.`);
		}

		await outputJSONFile(file, [
			{
				asin,
				height: metadata.height,
				published: Date.now(),
				title,
				width: metadata.width,
			},
			...books,
		]);
		await runCommand("git", ["add", "--", file]);
		await runCommand("git", ["commit", `--message=Read ${asin}`]);
		const url = `https://www.amazon.co.jp/exec/obidos/ASIN/${asin}/hail2unet-22`;
		const text = encodeURIComponent(`${title} ${url}`);
		await runCommand("open", [`twitter://post?text=${text}`]);
	} finally {
		clearTimeout(abortID);
	}
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
