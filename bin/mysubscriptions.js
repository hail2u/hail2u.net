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
	data.subscriptions = subscriptions;
	const rendered = mustache.render(template, data);
	await outputFile(config.paths.dest.mysubscriptions, rendered);
};

mustache.escape = escapeCharacters;
main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
