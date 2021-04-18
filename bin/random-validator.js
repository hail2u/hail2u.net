import config from "../.config.js";
import fs from "fs/promises";
import path from "path";
import { readJSONFile } from "../lib/json-file.js";
import { shuffleArray } from "../lib/shuffle-array.js";
import { validateHTML } from "../lib/validate-html.js";

const rewritePath = ([, relative]) => {
	if (relative.endsWith("/")) {
		return path.join(config.paths.dest.root, relative, "index.html");
	}

	return path.join(config.paths.dest.root, relative);
};

const isNotStyleGuide = (file) => file !== config.paths.dest.styleGuide;

const formatMessage = (file, messages, message) => {
	if (message.message.includes("“Permissions-Policy”")) {
		return messages;
	}

	return [
		...messages,
		`${file}:${message.lastLine}:${message.lastColumn}: ${message.message}`,
	];
};

const validate = async (file) => {
	const html = await fs.readFile(file, "utf8");
	const messages = await validateHTML(html);

	if (typeof messages === "string") {
		process.stdout.write(`${file}:1:1: ${messages}
`);
		return [];
	}

	const formatted = messages.reduce(formatMessage.bind(null, file), []);

	if (formatted.length === 0) {
		process.stdout.write(`${file}:1:1: Some errors, but ignored.
`);
		return [];
	}

	return formatted;
};

const isNotEmpty = (result) => result.length !== 0;

const main = async () => {
	const [{ domain, scheme }, sitemap] = await Promise.all([
		readJSONFile(config.paths.metadata.root),
		fs.readFile(config.paths.dest.sitemap, "utf8"),
	]);
	const prefix = `${scheme}://${domain}`;
	const indexRe = RegExp(`<loc>${prefix}(.*?/)</loc>`, "gu");
	const indexes = Array.from(sitemap.matchAll(indexRe), rewritePath).filter(
		isNotStyleGuide
	);
	const articleRe = RegExp(`<loc>${prefix}(/blog/.*?[^/])</loc>`, "gu");
	const articles = shuffleArray(
		Array.from(sitemap.matchAll(articleRe), rewritePath)
	).slice(0, 3);
	const results = await Promise.all([...indexes, ...articles].map(validate));
	const errors = results.flat();
	const errorFiles = results.filter(isNotEmpty);

	if (errors.length > 0) {
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
