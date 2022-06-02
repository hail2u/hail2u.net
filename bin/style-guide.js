import config from "../.config.js";
import fs from "node:fs/promises";
import { outputFile } from "../lib/output-file.js";
import path from "node:path";
import { readJSONFile } from "../lib/json-file.js";

const toAbsolutePath = (m, attr, rel) => {
	if (rel === "/style-guide/") {
		return m;
	}

	return `${attr}="${rel}"`;
};

const main = async () => {
	const [
		{
			domain,
			scheme
		},
		html
	] = await Promise.all([
		readJSONFile(path.join(config.src.metadata, "global.json")),
		fs.readFile(config.src.styleGuide, "utf8")
	]);
	const urlRe = new RegExp(`\\b(href|src)="(?:\\.\\./\\.\\./(?:assets|static)|${scheme}://${domain})(/.*?)"`, "gu");
	const optimized = html.replace(urlRe, toAbsolutePath);
	await outputFile(config.dest.styleGuide, optimized);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
