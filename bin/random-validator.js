import config from "../.config.js";
import fs from "fs/promises";
import { readJSONFile } from "../lib/json-file.js";
import { shuffleArray } from "../lib/shuffle-array.js";
import { validateHTML } from "../lib/validate-html.js";

const pickPath = (root, [, path]) => {
	if (path.endsWith("/")) {
		return `${root}${path}index.html`;
	}

	return `${root}${path}`;
};

const isNotStyleGuide = (styleGuide, file) => file !== styleGuide;

const formatMessage = (file, message) =>
	`${file}:${message.lastLine}:${message.lastColumn}: ${message.message}`;

const validate = async (file) => {
	const html = await fs.readFile(file, "utf8");
	const messages = await validateHTML(html);

	if (typeof messages === "string") {
		process.stdout.write(`${file}:1:1: ${messages}
`);
		return [];
	}

	return messages.map(formatMessage.bind(null, file));
};

const isEmpty = (element) => element.length !== 0;

const main = async () => {
	const [metadata, sitemap] = await Promise.all([
		readJSONFile(config.paths.metadata.root),
		fs.readFile(config.paths.dest.sitemap, "utf8"),
	]);
	const prefix = `${metadata.scheme}://${metadata.domain}/`;
	const reIndex = RegExp(`<loc>${prefix}(.*?/)</loc>`, "gu");
	const indexes = Array.from(
		sitemap.matchAll(reIndex),
		pickPath.bind(null, config.paths.dest.root)
	).filter(isNotStyleGuide.bind(null, config.paths.dest.styleGuide));
	const reArticle = RegExp(`<loc>${prefix}(blog/.*?[^/])</loc>`, "gu");
	const articles = shuffleArray(
		Array.from(
			sitemap.matchAll(reArticle),
			pickPath.bind(null, config.paths.dest.root)
		)
	).slice(0, 5);
	const results = await Promise.all([...indexes, ...articles].map(validate));
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
