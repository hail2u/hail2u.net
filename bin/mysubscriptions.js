import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import fs from "fs/promises";
import mustache from "mustache";
import { outputFile } from "../lib/output-file.js";
import { readJSONFile } from "../lib/json-file.js";

const main = async () => {
	const [data, subscriptions, template] = await Promise.all([
		readJSONFile(config.paths.metadata.root),
		readJSONFile(config.paths.data.subscriptions),
		fs.readFile(config.paths.src.mysubscriptions, "utf8"),
	]);
	const rendered = mustache.render(
		template,
		{
			...data,
			subscriptions,
		},
		null,
		{
			escape: escapeCharacters,
		}
	);
	await outputFile(config.paths.dest.mysubscriptions, rendered);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
