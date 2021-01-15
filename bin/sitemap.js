import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import fs from "fs/promises";
import mustache from "mustache";
import { outputFile } from "../lib/output-file.js";
import { readJSONFile } from "../lib/json-file.js";

const main = async () => {
	const [data, articles, documents, template] = await Promise.all([
		readJSONFile(config.paths.metadata.root),
		readJSONFile(config.paths.data.articles),
		readJSONFile(config.paths.data.documents),
		fs.readFile(config.paths.src.sitemap, "utf8"),
	]);
	const rendered = mustache.render(
		template,
		{
			...data,
			articles,
			documents,
		},
		null,
		{
			escape: escapeCharacters,
		}
	);
	await outputFile(config.paths.dest.sitemap, rendered);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
