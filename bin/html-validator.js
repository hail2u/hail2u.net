import {
	formatMessage,
	validateHTML,
	writeErrors
} from "../lib/validate-html.js";
import config from "../.config.js";
import fs from "node:fs/promises";
import path from "node:path";
import { readJSONFile } from "../lib/json-file.js";
import { shuffleArray } from "../lib/shuffle-array.js";

const rewritePath = ([
		,
		relative
	]) => {
	if (relative.endsWith("/")) {
		return path.join(config.dest.root, relative, "index.html");
	}

	return path.join(config.dest.root, relative);
};

const isNotStyleGuide = (file) => file !== config.dest.styleGuide;

const validate = async (file) => {
	const html = await fs.readFile(file, "utf8");
	const messages = await validateHTML(html);

	if (!messages) {
		return [];
	}

	return Promise.all(messages.map(formatMessage.bind(null, file, 0)));
};

const isNotEmpty = (element) => element.length !== 0;

const main = async () => {
	const [
		{
			domain,
			scheme
		},
		sitemap
	] = await Promise.all([
		readJSONFile(path.join(config.src.metadata, "global.json")),
		fs.readFile(config.dest.sitemap, "utf8")
	]);
	const prefix = `${scheme}://${domain}`;
	const indexRe = RegExp(`<loc>${prefix}(.*?/)</loc>`, "gu");
	const indexes = Array
		.from(sitemap.matchAll(indexRe), rewritePath)
		.filter(isNotStyleGuide);
	const articleRe = RegExp(`<loc>${prefix}(/blog/.*?[^/])</loc>`, "gu");
	const articles = Array.from(sitemap.matchAll(articleRe), rewritePath);
	const picked = shuffleArray(articles).slice(0, 3);
	const results = await Promise.all([
		...indexes,
		...picked
	].map(validate));
	const errors = results.flat();

	if (errors.length > 0) {
		const errorFiles = results.filter(isNotEmpty);
		writeErrors(errors, errorFiles);
	}
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
