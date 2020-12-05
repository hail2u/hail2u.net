import config from "./config.js";
import fs from "fs/promises";
import { readJSONFile } from "../lib/json-file.js";
import { validateHTML } from "../lib/validate-html.js";

const shuffleArray = (array) => {
	const shuffled = [...array];

	for (let i = array.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));

		if (i === j) {
			continue;
		}

		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled;
};

const pickPath = (root, match) => `${root}${match[1]}`;

const formatMessage = (file, message) =>
	`${file}:${message.lastLine}:${message.lastColumn}: ${message.message}`;

const validate = async (file) => {
	const html = await fs.readFile(file, "utf8");
	const messages = await validateHTML(html);
	return messages.map(formatMessage.bind(null, file));
};

const isEmpty = (element) => element.length !== 0;

const main = async () => {
	const [metadata, sitemap] = await Promise.all([
		readJSONFile(config.metadata.root),
		fs.readFile(config.dest.sitemap, "utf8"),
	]);
	const prefix = `${metadata.scheme}://${metadata.domain}/`;
	const reArticle = RegExp(`<loc>${prefix}(blog/.*?[^/])</loc>`, "gu");
	const articles = shuffleArray(
		Array.from(
			sitemap.matchAll(reArticle),
			pickPath.bind(null, config.dest.root)
		)
	).slice(0, 10);
	const reDocuments = RegExp(`<loc>${prefix}(documents/.*?[^/])</loc>`, "gu");
	const documents = shuffleArray(
		Array.from(
			sitemap.matchAll(reDocuments),
			pickPath.bind(null, config.dest.root)
		)
	).slice(0, 1);
	const results = await Promise.all(
		[
			"dist/index.html",
			"dist/blog/index.html",
			"dist/bookshelf/index.html",
			"dist/documents/index.html",
			"dist/links/index.html",
			"dist/statuses/index.html",
			...documents,
			...articles,
		].map(validate)
	);
	const errors = results.flat();
	const errorFiles = results.filter(isEmpty);

	if (errors.length > 1) {
		process.stderr.write(errors.join("\n"));
		process.stderr.write("\n\n");
		throw new Error(
			`${errors.length} error(s) in ${errorFiles.length} file(s)`
		);
	}
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
