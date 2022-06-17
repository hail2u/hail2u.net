import {
	outputJSONFile,
	readJSONFile
} from "../lib/json-file.js";
import { buffer } from "node:stream/consumers";
import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import { getDateDetails } from "../lib/get-date-details.js";
import { openTwitter } from "../lib/open-twitter.js";
import { parseArgs } from "node:util";
import path from "node:path";
import { runCommand } from "../lib/run-command.js";
import sharp from "sharp";

const isReadBook = (title, book) => title === book.title;

const cancelFetch = (abortController) => {
	abortController.abort();
};

const main = async () => {
	const {
		values: {
			asin,
			title
		}
	} = parseArgs({
		options: {
			asin: {
				short: "a",
				type: "string"
			},
			title: {
				short: "t",
				type: "string"
			}
		}
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

	const file = path.join(config.src.data, "books.json");
	const books = await readJSONFile(file);

	if (books.find(isReadBook.bind(null, title))) {
		throw new Error(`${title} has already been added.`);
	}

	const abortController = new AbortController();
	const abortID = setTimeout(cancelFetch.bind(null, abortController), 5000);

	try {
		const cover = `https://m.media-amazon.com/images/P/${asin}.jpg`;
		const res = await fetch(cover, { signal: abortController.signal });

		if (!res.ok) {
			throw new Error(`${res.status} ${res.statusText}`);
		}

		const img = await buffer(res.body);
		const metadata = await sharp(img).metadata();

		if (metadata.height === 1 && metadata.width === 1) {
			throw new Error(`${title} does not have a cover image.`);
		}

		const link = `https://www.amazon.co.jp/exec/obidos/ASIN/${asin}/hail2unet-22`;
		const titleEscaped = escapeCharacters(title);
		const body = `<a href="${link}"><img height="${metadata.height}" loading="lazy" src="${cover}" title="${titleEscaped}" width="${metadata.width}"></a>`;
		const published = Date.now();
		const dt = getDateDetails(published);
		await outputJSONFile(file, [
			{
				body,
				description: title,
				link,
				published,
				...dt,
				title,
				type: "book"
			},
			...books
		]);
		await runCommand("git", [
			"add",
			"--",
			file
		]);
		await runCommand("git", [
			"commit",
			`--message=Read ${asin}`
		]);
		const url = `https://www.amazon.co.jp/exec/obidos/ASIN/${asin}/hail2unet-22`;
		await openTwitter(`${title} ${url}`);
	} catch (e) {
		if (e.name === "AbortError") {
			throw new Error("Amazon image server does not respond in 5s.");
		}

		throw e;
	} finally {
		clearTimeout(abortID);
	}
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
